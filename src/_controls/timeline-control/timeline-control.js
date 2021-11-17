/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {Animation} from '../../_utils/animation';
import {getClient} from '../../cloud-client/client';
import {interpolateDatetime} from '../../_utils/datetime';
import {formatDatetime} from '../../_utils/format';
import './timeline-control.css';

/** @typedef {import('./timeline-control').TimelineConfig} TimelineConfig */
/** @typedef {import('../../cloud-client/client').Client} Client */
/** @typedef {import('../../cloud-client/stac').StacCollection} StacCollection */

const FPS = 15;
const STEP = 1;
const STEP_INTERPOLATE = 0.25;

export class TimelineControl {
  /** @type {TimelineConfig} */
  config = undefined;
  /** @type {number} */
  step = undefined;
  /** @type {Client} */
  client = undefined;
  /** @type {HTMLElement} */
  container = undefined;
  /** @type {StacCollection} */
  stacCollection = undefined;
  /** @type {string[]} */
  datetimes = undefined;
  /** @type {Animation} */
  animation = undefined;
  /** @type {boolean} */
  loading = false;

  /**
   * @param {TimelineConfig} config
   */
  constructor(config) {
    this.config = config;
    this.step = config.datetimeInterpolate ? STEP_INTERPOLATE : STEP;
    this.client = getClient();

    this.animation = new Animation(() => {
      if (this.progress < this.datetimes.length - 1) {
        this.progress += this.step;

        if (Math.ceil(this.progress / this.step) !== this.progress / this.step) {
          this.progress = Math.ceil(this.progress / this.step) * this.step;
        }
      } else {
        this.progress = 0;
      }

      this.updateProgress();
    }, FPS);
  }

  /**
   * @returns {number}
   */
  get progress() {
    const progressInput = this.container.querySelector('input');
    if (!progressInput) {
      return 0;
    }

    return progressInput.valueAsNumber;
  }

  /**
   * @param {number} value
   * @returns {void}
   */
  set progress(value) {
    const progressInput = this.container.querySelector('input');
    if (!progressInput) {
      return;
    }

    progressInput.valueAsNumber = value;
  }

  /**
   * @returns {void}
   */
  updateProgress() {
    const index = Math.floor(this.progress);
    const startDatetime = this.datetimes[index];
    const endDatetime = this.datetimes[index + 1];
    const ratio = endDatetime ? Math.round((this.progress - index) * 100) / 100 : 0;
    const datetime = endDatetime ? interpolateDatetime(startDatetime, endDatetime, ratio) : startDatetime;
    
    this.config.onUpdate({
      datetime,
    });
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-timeline-control';

    this.update(this.config);

    return this.container;
  }

  /**
   * @returns {void}
   */
  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async toggleAnimation() {
    if (this.loading) {
      return;
    }

    const playPauseButton = this.container.querySelector('a');
    const progressInput = this.container.querySelector('input');
    const info = this.container.querySelector('span');
    if (!playPauseButton || !progressInput || !info) {
      return;
    }

    if (this.animation.running) {
      playPauseButton.classList.remove('pause');
      playPauseButton.classList.add('play');

      this.animation.stop();
    } else {
      playPauseButton.classList.remove('play');
      playPauseButton.classList.add('pause');

      // preload images
      this.loading = true;
      this.container.classList.add('loading');
      progressInput.disabled = true;
      info.innerHTML = 'Loading...';
      await Promise.all(this.datetimes.map(x => this.client.loadStacCollectionDataByDatetime(this.config.dataset, x)));
      info.innerHTML = formatDatetime(this.config.datetime);
      progressInput.disabled = false;
      this.container.classList.remove('loading');
      this.loading = false;

      this.animation.start();
    }

    this.updateProgress();
  }

  /**
   * @param {TimelineConfig} config
   * @returns {Promise<void>}
   */
  async update(config) {
    if (!this.container) {
      return;
    }
    this.step = config.datetimeInterpolate ? STEP_INTERPOLATE : STEP;
    if (this.stacCollection && this.config.dataset === config.dataset) {
      const info = this.container.querySelector('span');
      const progressInput = this.container.querySelector('input');
      info.innerHTML = formatDatetime(config.datetime);
      progressInput.step = this.step;
      return;
    }

    this.config = config;
    
    if (!this.config.dataset) {
      this.container.innerHTML = '';
      return;
    }

    this.stacCollection = await this.client.loadStacCollection(this.config.dataset);
    this.datetimes = this.client.getStacCollectionDatetimes(this.stacCollection);
    if (this.datetimes.length < 2) {
      this.container.innerHTML = '';
      return;
    }

    const paddingY = 10;
    const playPauseButtonWidth = 16;
    const progressInputMarginLeft = 10;

    this.container.innerHTML = '';
    this.container.style.width = `${this.config.width}px`;

    const div = document.createElement('div');
    this.container.appendChild(div);

    const playPauseButton = document.createElement('a');
    playPauseButton.href = 'javascript:void(0)';
    playPauseButton.className = this.animation.running ? 'pause' : 'play';
    playPauseButton.addEventListener('click', this.toggleAnimation.bind(this));
    div.appendChild(playPauseButton);

    const progressInput = document.createElement('input');
    progressInput.type = 'range';
    progressInput.min = 0;
    progressInput.max = this.datetimes.length - 1;
    progressInput.step = this.step;
    progressInput.value = this.datetimes.findIndex(x => x >= this.config.datetime);
    progressInput.style.width = `${this.config.width - 2 * paddingY - playPauseButtonWidth - progressInputMarginLeft}px`;
    progressInput.addEventListener('input', () => this.updateProgress());
    div.appendChild(progressInput);

    const info = document.createElement('span');
    info.innerHTML = formatDatetime(this.config.datetime);
    div.appendChild(info);
  }
}