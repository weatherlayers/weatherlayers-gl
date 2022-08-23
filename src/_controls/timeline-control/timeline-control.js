import {Animation} from '../../_utils/animation';
import {interpolateDatetime} from '../../_utils/datetime';
import {formatDatetime} from '../../_utils/format';
import {randomString} from '../../_utils/random-string';
import {Control} from '../control';
import './timeline-control.css';

/** @typedef {import('./timeline-control').TimelineConfig} TimelineConfig */

const DEFAULT_WIDTH = 300;

const FPS = 15;
const STEP = 1;
const STEP_INTERPOLATE = 0.25;

const LOADING_CLASS = 'loading';
const RUNNING_CLASS = 'running';

export class TimelineControl extends Control {
  /** @type {TimelineConfig} */
  config;
  /** @type {HTMLElement | undefined} */
  container = undefined;
  /** @type {Animation} */
  animation;

  /**
   * @param {TimelineConfig} [config]
   */
  constructor(config = {}) {
    super();
    this.config = config;
    this.animation = new Animation(() => this.animationUpdated(), FPS);
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-timeline-control';

    this.setConfig(this.config);

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
   * @returns {boolean}
   */
  get loading() {
    if (!this.container) {
      return false;
    }

    return this.container.classList.contains(LOADING_CLASS);
  }

  /**
   * @param {boolean} value
   */
  set loading(value) {
    if (!this.container) {
      return;
    }

    this.container.classList.toggle(LOADING_CLASS, value);
  }

  /**
   * @returns {boolean}
   */
  get running() {
    if (!this.container) {
      return false;
    }

    return this.container.classList.contains(RUNNING_CLASS);
  }

  /**
   * @param {boolean} value
   */
  set running(value) {
    if (!this.container) {
      return;
    }

    this.container.classList.toggle(RUNNING_CLASS, value);
  }

  /**
   * @returns {string[]}
   */
  get startEndDatetimes() {
    if (!this.container) {
      return [];
    }

    const progressInput = this.container.querySelector('input');
    if (!progressInput) {
      return [];
    }

    const startDatetime = this.config.datetimes[Math.floor(progressInput.valueAsNumber)];
    const endDatetime = this.config.datetimes[Math.ceil(progressInput.valueAsNumber)];
    if (startDatetime === endDatetime) {
      return [startDatetime];
    } else {
      return [startDatetime, endDatetime];
    }
  }

  /**
   * @returns {void}
   */
  updateProgress() {
    if (!this.container) {
      return;
    }

    const currentDatetime = this.container.querySelector('.current-datetime');
    const progressInput = this.container.querySelector('input');
    if (!currentDatetime || !progressInput) {
      return;
    }
    
    const startDatetime = this.config.datetimes[Math.floor(progressInput.valueAsNumber)];
    const endDatetime = this.config.datetimes[Math.ceil(progressInput.valueAsNumber)];
    const ratio = progressInput.valueAsNumber % 1;
    const datetime = interpolateDatetime(startDatetime, endDatetime, ratio);
    
    this.config.datetime = datetime;
    currentDatetime.innerHTML = formatDatetime(datetime);

    if (this.config.onUpdate) {
      this.config.onUpdate(datetime);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async playButtonClicked() {
    if (this.loading || this.running) {
      return;
    }

    await this.preload(this.config.datetimes);

    this.animation.start();
    this.running = true;

    this.updateProgress();
  }

  /**
   * @returns {void}
   */
  pauseButtonClicked() {
    if (this.loading || !this.running) {
      return;
    }

    this.animation.stop();
    this.running = false;

    this.updateProgress();
  }

  /**
   * @returns {Promise<void>}
   */
  async progressInputClicked() {
    if (this.loading || this.running) {
      return;
    }

    await this.preload(this.startEndDatetimes);

    this.updateProgress();
  }

  /**
   * @returns {Promise<void>}
   */
  async stepBackwardButtonClicked() {
    if (this.loading || this.running) {
      return;
    }

    if (!this.container) {
      return;
    }

    const progressInput = this.container.querySelector('input');
    if (!progressInput) {
      return;
    }

    if (progressInput.value !== progressInput.min) {
      progressInput.stepDown();
    } else {
      progressInput.value = progressInput.max;
    }

    await this.preload(this.startEndDatetimes);

    this.updateProgress();
  }

  /**
   * @returns {Promise<void>}
   */
  async stepForwardButtonClicked() {
    if (this.loading || this.running) {
      return;
    }

    if (!this.container) {
      return;
    }

    const progressInput = this.container.querySelector('input');
    if (!progressInput) {
      return;
    }

    if (progressInput.value !== progressInput.max) {
      progressInput.stepUp();
    } else {
      progressInput.value = progressInput.min;
    }

    await this.preload(this.startEndDatetimes);

    this.updateProgress();
  }

  /**
   * @returns {void}
   */
  animationUpdated() {
    if (this.loading || !this.running) {
      return;
    }

    if (!this.container) {
      return;
    }

    const progressInput = this.container.querySelector('input');
    if (!progressInput) {
      return;
    }

    if (progressInput.value !== progressInput.max) {
      progressInput.stepUp();
    } else {
      progressInput.value = progressInput.min;
    }

    this.updateProgress();
  }

  /**
   * @param {string[]} datetimes
   * @returns {Promise<void>}
   */
  async preload(datetimes) {
    if (!this.container) {
      return;
    }
    if (!this.config.onPreload) {
      return;
    }

    this.loading = true;
    await this.config.onPreload(datetimes);
    this.loading = false;
  }

  /**
   * @param {TimelineConfig} config
   * @returns {void}
   */
  setConfig(config) {
    if (!this.container) {
      return;
    }

    // validate config
    if (!config.datetimes || config.datetimes.length < 2 || !config.datetime) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.width === config.width &&
      this.config.datetimes.length === config.datetimes.length &&
      this.config.datetimes.every((datetime, i) => datetime === config.datetimes[i]) &&
      this.config.datetimeInterpolate === config.datetimeInterpolate &&
      this.config.datetime === config.datetime &&
      this.config.onPreload === config.onPreload &&
      this.config.onUpdate === config.onUpdate
    ) {
      return;
    }

    this.config = config;
    const width = this.config.width || DEFAULT_WIDTH;
    const datetimes = this.config.datetimes;
    const datetimeInterpolate = this.config.datetimeInterpolate;
    const datetime = this.config.datetime;

    this.container.innerHTML = '';
    this.container.style.width = `${width}px`;

    const div = document.createElement('div');
    this.container.appendChild(div);

    const header = document.createElement('header');
    div.appendChild(header);

    const currentDatetime = document.createElement('span');
    currentDatetime.className = 'current-datetime';
    currentDatetime.innerHTML = formatDatetime(datetime);
    header.appendChild(currentDatetime);

    const main = document.createElement('main');
    div.appendChild(main);
    
    const progressInputTicksId = `progress-input-ticks-${randomString()}`;
    const progressInput = document.createElement('input');
    progressInput.className = 'progress-input';
    progressInput.type = 'range';
    progressInput.min = '0';
    progressInput.max = `${datetimes.length - 1}`;
    progressInput.step = `${datetimeInterpolate ? STEP_INTERPOLATE : STEP}`;
    progressInput.valueAsNumber = datetimes.findIndex(x => x >= datetime);
    progressInput.setAttribute('list', progressInputTicksId);
    progressInput.addEventListener('input', () => this.progressInputClicked());
    main.appendChild(progressInput);

    const progressInputTicks = document.createElement('datalist');
    progressInputTicks.id = progressInputTicksId;
    main.appendChild(progressInputTicks);

    for (let i = 0; i < datetimes.length; i++) {
      const progressInputTick = document.createElement('option');
      progressInputTick.innerHTML = `${i}`;
      progressInputTicks.appendChild(progressInputTick);
    }

    const footer = document.createElement('footer');
    div.appendChild(footer);

    const startDatetime = document.createElement('span');
    startDatetime.className = 'start-datetime';
    startDatetime.innerHTML = formatDatetime(datetimes[0]);
    footer.appendChild(startDatetime);

    const buttons = document.createElement('span');
    buttons.className = 'buttons';
    footer.appendChild(buttons);

    const endDatetime = document.createElement('span');
    endDatetime.className = 'end-datetime';
    endDatetime.innerHTML = formatDatetime(datetimes[datetimes.length - 1]);
    footer.appendChild(endDatetime);

    const stepBackwardButton = document.createElement('a');
    stepBackwardButton.href = 'javascript:void(0)';
    stepBackwardButton.className = 'button step-backward-button';
    stepBackwardButton.addEventListener('click', () => this.stepBackwardButtonClicked());
    buttons.appendChild(stepBackwardButton);

    const playButton = document.createElement('a');
    playButton.href = 'javascript:void(0)';
    playButton.className = 'button play-button';
    playButton.addEventListener('click', () => this.playButtonClicked());
    buttons.appendChild(playButton);

    const pauseButton = document.createElement('a');
    pauseButton.href = 'javascript:void(0)';
    pauseButton.className = 'button pause-button';
    pauseButton.addEventListener('click', () => this.pauseButtonClicked());
    buttons.appendChild(pauseButton);

    const stepForwardButton = document.createElement('a');
    stepForwardButton.href = 'javascript:void(0)';
    stepForwardButton.className = 'button step-forward-button';
    stepForwardButton.addEventListener('click', () => this.stepForwardButtonClicked());
    buttons.appendChild(stepForwardButton);
  }
}