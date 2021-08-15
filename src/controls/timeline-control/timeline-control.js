/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Animation } from '../../utils/animation';
import { getStacCollectionDatetimes } from '../../utils/stac';
import './timeline-control.css';

/** @typedef {import('./timeline-control').TimelineConfig} TimelineConfig */

export class TimelineControl {
  /** @type {TimelineConfig} */
  config = undefined;
  /** @type {HTMLElement} */
  container = undefined;
  /** @type {string[]} */
  datetimes = undefined;
  /** @type {Animation} */
  animation = undefined;
  /** @type {number} */
  progress = 0;

  /**
   * @param {TimelineConfig} config
   */
  constructor(config) {
    this.config = config;

    this.animation = new Animation(() => {
      if (this.progress < this.datetimes.length - 1) {
        this.progress += 0.05;
      } else {
        this.progress = 0;
      }

      this.container.querySelector('input').value = this.progress;
      this.updateProgress();
    });
  }

  /**
   * @returns {void}
   */
  updateProgress() {
    const datetimeIndex = Math.floor(this.progress);
    const datetime = this.datetimes[datetimeIndex];
    const datetime2 = this.datetimes[datetimeIndex + 1];
    const datetimeWeight = Math.round((this.progress - datetimeIndex) * 100) / 100;
    
    this.config.onUpdate({
      datetime,
      datetime2,
      datetimeWeight,
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
    const playPauseButton = this.container.querySelector('a');
    if (!playPauseButton) {
      return;
    }

    if (this.animation.running) {
      this.config.onStop?.();
      this.animation.stop();
      playPauseButton.className = 'play';
    } else {
      await this.config.onStart?.(this.datetimes);
      this.animation.start();
      playPauseButton.className = 'pause';
    }
  }

  /**
   * @param {TimelineConfig} config
   * @returns {void}
   */
  update(config) {
    if (!this.container) {
      return;
    }
    if (this.container.children.length && this.config.stacCollection === config.stacCollection) {
      return;
    }

    this.config = config;
    this.container.innerHTML = '';
    
    if (!this.config.stacCollection) {
      return;
    }

    this.datetimes = getStacCollectionDatetimes(this.config.stacCollection);
    if (this.datetimes.length < 2) {
      return;
    }

    const paddingY = 10;
    const playPauseButtonWidth = 16;
    const progressInputMarginLeft = 10;

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
    progressInput.step = 0.05;
    progressInput.value = this.progress;
    progressInput.style.width = `${this.config.width - 2 * paddingY - playPauseButtonWidth - progressInputMarginLeft}px`;
    progressInput.addEventListener('input', () => {
      this.progress = progressInput.value;
      this.updateProgress();
    });
    div.appendChild(progressInput);
  }
}