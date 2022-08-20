import {Animation} from '../../_utils/animation';
import {interpolateDatetime} from '../../_utils/datetime';
import {formatDatetime} from '../../_utils/format';
import './timeline-control.css';

/** @typedef {import('./timeline-control').TimelineConfig} TimelineConfig */

const DEFAULT_WIDTH = 250;

const FPS = 15;
const STEP = 1;
const STEP_INTERPOLATE = 0.25;

const PADDING_Y = 10;
const PLAY_PAUSE_BUTTON_WIDTH = 16;
const PROGRESS_INPUT_MARGIN_LEFT = 10;

export class TimelineControl {
  /** @type {TimelineConfig} */
  config;
  /** @type {HTMLElement | undefined} */
  container = undefined;
  /** @type {Animation} */
  animation;
  /** @type {boolean} */
  loading = false;

  /**
   * @param {TimelineConfig} config
   */
  constructor(config) {
    this.config = config;

    this.animation = new Animation(() => {
      if (this.progress < this.config.datetimes.length - 1) {
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
  get step() {
    return this.config.datetimeInterpolate ? STEP_INTERPOLATE : STEP;
  }

  /**
   * @returns {number}
   */
  get progress() {
    if (!this.container) {
      return 0;
    }

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
    if (!this.container) {
      return;
    }

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
    if (!this.container) {
      return;
    }

    const info = this.container.querySelector('span');
    if (!info) {
      return;
    }
    
    const index = Math.floor(this.progress);
    const startDatetime = this.config.datetimes[index];
    const endDatetime = this.config.datetimes[index + 1];
    const ratio = endDatetime ? Math.round((this.progress - index) * 100) / 100 : 0;
    const datetime = endDatetime ? interpolateDatetime(startDatetime, endDatetime, ratio) : startDatetime;
    
    this.config.datetime = datetime;
    info.innerHTML = formatDatetime(datetime);

    if (this.config.onUpdate) {
      this.config.onUpdate({ datetime });
    }
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

    if (!this.container) {
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

      if (this.config.onStop) {
        this.config.onStop();
      }

      this.animation.stop();
    } else {
      playPauseButton.classList.remove('play');
      playPauseButton.classList.add('pause');

      if (this.config.onStart) {
        this.loading = true;
        this.container.classList.add('loading');
        progressInput.disabled = true;
        info.innerHTML = 'Loading...';
        await this.config.onStart();
        info.innerHTML = formatDatetime(this.config.datetime);
        progressInput.disabled = false;
        this.container.classList.remove('loading');
        this.loading = false;
      }

      this.animation.start();
    }

    this.updateProgress();
  }

  /**
   * @param {TimelineConfig} config
   * @returns {void}
   */
  update(config) {
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
      this.config.onStart === config.onStart &&
      this.config.onUpdate === config.onUpdate &&
      this.config.onStop === config.onStop
    ) {
      return;
    }

    this.config = config;
    const width = this.config.width || DEFAULT_WIDTH;
    const datetimes = this.config.datetimes;
    const datetime = this.config.datetime;

    this.container.innerHTML = '';
    this.container.style.width = `${width}px`;

    const div = document.createElement('div');
    this.container.appendChild(div);

    const playPauseButton = document.createElement('a');
    playPauseButton.href = 'javascript:void(0)';
    playPauseButton.className = this.animation.running ? 'pause' : 'play';
    playPauseButton.addEventListener('click', () => this.toggleAnimation());
    div.appendChild(playPauseButton);

    const progressInput = document.createElement('input');
    progressInput.type = 'range';
    progressInput.min = 0;
    progressInput.max = datetimes.length - 1;
    progressInput.step = this.step;
    progressInput.valueAsNumber = datetimes.findIndex(x => x >= datetime);
    progressInput.style.width = `${width - 2 * PADDING_Y - PLAY_PAUSE_BUTTON_WIDTH - PROGRESS_INPUT_MARGIN_LEFT}px`;
    progressInput.addEventListener('input', () => this.updateProgress());
    div.appendChild(progressInput);

    const info = document.createElement('span');
    info.innerHTML = formatDatetime(datetime);
    div.appendChild(info);
  }
}