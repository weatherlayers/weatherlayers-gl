import {Animation} from '../../_utils/animation.js';
import type {AnimationConfig} from '../../_utils/animation.js';
import {interpolateDatetime, getDatetimeWeight, formatDatetime} from '../../_utils/datetime.js';
import type {DatetimeISOString, DatetimeFormatFunction} from '../../_utils/datetime.js';
import {randomString} from '../../_utils/random-string.js';
import {findLastIndex} from '../../_utils/array.js';
import {Control} from '../control.js';
import './timeline-control.css';

export interface TimelineControlConfig {
  width?: number;
  datetimes: DatetimeISOString[];
  datetime: DatetimeISOString;
  datetimeInterpolate?: boolean;
  datetimeFormatFunction?: DatetimeFormatFunction;
  onPreload?: (datetimes: DatetimeISOString[]) => Promise<void>[] | Promise<void>;
  onUpdate?: (datetime: DatetimeISOString) => void;
  fps?: number;
}

const DEFAULT_WIDTH = 300;

const FPS = 15;
const STEP = 1;
const STEP_INTERPOLATE = 0.25;

const CONTROL_CLASS = 'weatherlayers-timeline-control';
const CURRENT_DATETIME_CLASS = `${CONTROL_CLASS}__current-datetime`;
const PROGRESS_INPUT_CLASS = `${CONTROL_CLASS}__progress-input`;
const START_DATETIME_CLASS = `${CONTROL_CLASS}__start-datetime`;
const BUTTONS_CLASS = `${CONTROL_CLASS}__buttons`;
const END_DATETIME_CLASS = `${CONTROL_CLASS}__end-datetime`;
const BUTTON_CLASS = `${CONTROL_CLASS}__button`;
const STEP_BACKWARD_BUTTON_CLASS = `${CONTROL_CLASS}__step-backward-button`;
const PLAY_BUTTON_CLASS = `${CONTROL_CLASS}__play-button`;
const PAUSE_BUTTON_CLASS = `${CONTROL_CLASS}__pause-button`;
const STEP_FORWARD_BUTTON_CLASS = `${CONTROL_CLASS}__step-forward-button`;
const LOADER_CLASS = `${CONTROL_CLASS}__loader`;
const LOADER_ICON_CLASS = `${CONTROL_CLASS}__loader-icon`;
const LOADER_TEXT_CLASS = `${CONTROL_CLASS}__loader-text`;
const LOADING_CLASS = 'loading';
const RUNNING_CLASS = 'running';

export class TimelineControl extends Control<TimelineControlConfig> {
  private _config: TimelineControlConfig;
  private _container: HTMLElement | undefined = undefined;
  private _currentDatetime: HTMLElement | undefined = undefined;
  private _progressInput: HTMLInputElement | undefined = undefined;
  private _loaderText: HTMLSpanElement | undefined = undefined;
  private _loading: boolean = false;
  private _animation: Animation;

  constructor(config: TimelineControlConfig = {} as TimelineControlConfig) {
    super();
    this._config = config;
    this._animation = new Animation({
      onUpdate: () => this._animationUpdated(),
      fps: this._config.fps ?? FPS,
    } satisfies AnimationConfig);
  }

  protected onAdd(): HTMLElement {
    this._container = document.createElement('div');
    this._container.classList.add(CONTROL_CLASS);

    this.setConfig(this._config);

    return this._container;
  }

  protected onRemove(): void {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
      this._container = undefined;
      this._currentDatetime = undefined;
      this._progressInput = undefined;
    }
  }

  get loading(): boolean {
    return this._loading;
  }

  get running(): boolean {
    return this._running;
  }

  get _running(): boolean {
    return this._animation.running;
  }

  async toggle(running: boolean = !this._running): Promise<void> {
    if (running) {
      return await this.start();
    } else {
      return this.pause();
    }
  }

  async start(): Promise<void> {
    if (!this._container || this._loading || this._running) {
      return;
    }

    await this._preload(this._config.datetimes);

    this._animation.start();
    this._container.classList.add(RUNNING_CLASS);

    this._updateProgress();
  }

  pause(): void {
    if (!this._container || this._loading || !this._running) {
      return;
    }

    this._animation.stop();
    this._container.classList.remove(RUNNING_CLASS);

    this._updateProgress();
  }

  stop(): void {
    if (!this._container || !this._progressInput || this._loading || !this._running) {
      return;
    }

    this._animation.stop();
    this._container.classList.remove(RUNNING_CLASS);

    this._progressInput.valueAsNumber = 0;

    this._updateProgress();
  }

  reset(): void {
    if (!this._progressInput || this._loading || this._running) {
      return;
    }

    this._progressInput.valueAsNumber = 0;

    this._updateProgress();
  }

  async stepBackward(): Promise<void> {
    if (!this._progressInput || this._loading || this._running) {
      return;
    }

    if (this._progressInput.value !== this._progressInput.min) {
      this._progressInput.stepDown();
    } else {
      this._progressInput.value = this._progressInput.max;
    }

    await this._preload(this._startEndDatetimes);

    this._updateProgress();
  }

  async stepForward(): Promise<void> {
    if (!this._progressInput || this._loading || this._running) {
      return;
    }

    if (this._progressInput.value !== this._progressInput.max) {
      this._progressInput.stepUp();
    } else {
      this._progressInput.value = this._progressInput.min;
    }

    await this._preload(this._startEndDatetimes);

    this._updateProgress();
  }

  get _startEndDatetimes(): DatetimeISOString[] {
    if (!this._progressInput) {
      return [];
    }

    const startDatetime = this._config.datetimes[Math.floor(this._progressInput.valueAsNumber)];
    const endDatetime = this._config.datetimes[Math.ceil(this._progressInput.valueAsNumber)];
    if (startDatetime === endDatetime) {
      return [startDatetime];
    } else {
      return [startDatetime, endDatetime];
    }
  }

  private _updateProgress(): void {
    if (!this._progressInput || !this._currentDatetime) {
      return;
    }
    
    const startDatetime = this._config.datetimes[Math.floor(this._progressInput.valueAsNumber)];
    const endDatetime = this._config.datetimes[Math.ceil(this._progressInput.valueAsNumber)];
    const ratio = this._progressInput.valueAsNumber % 1;
    const datetime = interpolateDatetime(startDatetime, endDatetime, ratio);
    
    this._config.datetime = datetime;

    const datetimeFormatFunction = this._config.datetimeFormatFunction ?? formatDatetime;
    this._currentDatetime.innerHTML = datetimeFormatFunction(datetime);

    if (this._config.onUpdate) {
      this._config.onUpdate(datetime);
    }
  }

  private async _progressInputClicked(): Promise<void> {
    if (this._loading || this._running) {
      return;
    }

    await this._preload(this._startEndDatetimes);

    this._updateProgress();
  }

  private _animationUpdated(): void {
    if (!this._progressInput || this._loading || !this._running) {
      return;
    }

    if (this._progressInput.value !== this._progressInput.max) {
      this._progressInput.stepUp();
    } else {
      this._progressInput.value = this._progressInput.min;
    }

    this._updateProgress();
  }

  private async _preload(datetimes: DatetimeISOString[]): Promise<void> {
    if (!this._container || !this._loaderText || !this._config.onPreload) {
      return;
    }

    this._loading = true;
    this._container.classList.add(LOADING_CLASS);

    const promises = this._config.onPreload(datetimes);
    if (Array.isArray(promises)) {
      let successCount = 0;
      const updateLoaderText = () => {
        this._loaderText!.innerHTML = `Loading... ${successCount}/${promises.length}`;
      };
      updateLoaderText();
      for (let promise of promises) {
        promise.then(() => {
          successCount++;
          updateLoaderText();
        });
      }
      await Promise.all(promises);
      this._loaderText.innerHTML = '';
    } else {
      this._loaderText.innerHTML = 'Loading...';
      await promises;
      this._loaderText.innerHTML = '';
    }

    this._loading = false;
    this._container.classList.remove(LOADING_CLASS);
  }

  getConfig(): TimelineControlConfig {
    return {...this._config};
  }

  setConfig(config: TimelineControlConfig): void {
    if (!this._container) {
      return;
    }

    // validate config
    if (
      !config.datetimes ||
      config.datetimes.length < 2 ||
      !config.datetime ||
      config.datetime < config.datetimes[0] ||
      config.datetime > config.datetimes[config.datetimes.length - 1]
    ) {
      return;
    }

    // prevent update if no config changed
    if (
      this._container.children.length > 0 &&
      this._config.width === config.width &&
      this._config.datetimes.length === config.datetimes.length &&
      this._config.datetimes.every((datetime, i) => datetime === config.datetimes[i]) &&
      this._config.datetime === config.datetime &&
      this._config.datetimeInterpolate === config.datetimeInterpolate &&
      this._config.datetimeFormatFunction === config.datetimeFormatFunction &&
      this._config.onPreload === config.onPreload &&
      this._config.onUpdate === config.onUpdate
    ) {
      return;
    }

    this._config = config;
    const width = this._config.width ?? DEFAULT_WIDTH;
    const datetimes = this._config.datetimes;
    const datetime = this._config.datetime;
    const datetimeInterpolate = this._config.datetimeInterpolate ?? false;
    const datetimeFormatFunction = this._config.datetimeFormatFunction ?? formatDatetime;

    const datetimeStartIndex = findLastIndex(datetimes, x => x <= datetime);
    if (datetimeStartIndex < 0) {
      // overflow is handled by the validation above
      throw new Error('Invalid state');
    }
    const datetimeEndIndex = datetimeStartIndex < datetimes.length - 1 ? datetimeStartIndex + 1 : null;
    const datetimeStart = datetimes[datetimeStartIndex];
    const datetimeEnd = typeof datetimeEndIndex === 'number' ? datetimes[datetimeStartIndex + 1] : null;
    const datetimeWeight = getDatetimeWeight(datetimeStart, datetimeEnd, datetime);
    const progressInputStep = datetimeInterpolate ? STEP_INTERPOLATE : STEP;
    const progressInputValue = datetimeStartIndex + Math.floor(datetimeWeight / progressInputStep) * progressInputStep;

    this._container.innerHTML = '';
    this._container.style.width = `${width}px`;

    const div = document.createElement('div');
    this._container.appendChild(div);

    const header = document.createElement('header');
    div.appendChild(header);

    this._currentDatetime = document.createElement('span');
    this._currentDatetime.classList.add(CURRENT_DATETIME_CLASS);
    this._currentDatetime.innerHTML = datetimeFormatFunction(datetime);
    header.appendChild(this._currentDatetime);

    const main = document.createElement('main');
    div.appendChild(main);
    
    const progressInputTicksId = `${PROGRESS_INPUT_CLASS}-ticks-${randomString()}`;
    this._progressInput = document.createElement('input');
    this._progressInput.classList.add(PROGRESS_INPUT_CLASS);
    this._progressInput.type = 'range';
    this._progressInput.min = '0';
    this._progressInput.max = `${datetimes.length - 1}`;
    this._progressInput.step = `${progressInputStep}`;
    this._progressInput.valueAsNumber = progressInputValue;
    this._progressInput.setAttribute('list', progressInputTicksId);
    this._progressInput.addEventListener('input', () => this._progressInputClicked());
    main.appendChild(this._progressInput);

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
    startDatetime.classList.add(START_DATETIME_CLASS);
    startDatetime.innerHTML = datetimeFormatFunction(datetimes[0]);
    footer.appendChild(startDatetime);

    const buttons = document.createElement('span');
    buttons.classList.add(BUTTONS_CLASS);
    footer.appendChild(buttons);

    const endDatetime = document.createElement('span');
    endDatetime.classList.add(END_DATETIME_CLASS);
    endDatetime.innerHTML = datetimeFormatFunction(datetimes[datetimes.length - 1]);
    footer.appendChild(endDatetime);

    const stepBackwardButton = document.createElement('a');
    stepBackwardButton.href = 'javascript:void(0)';
    stepBackwardButton.classList.add(BUTTON_CLASS);
    stepBackwardButton.classList.add(STEP_BACKWARD_BUTTON_CLASS);
    stepBackwardButton.addEventListener('click', () => this.stepBackward());
    buttons.appendChild(stepBackwardButton);

    const playButton = document.createElement('a');
    playButton.href = 'javascript:void(0)';
    playButton.classList.add(BUTTON_CLASS);
    playButton.classList.add(PLAY_BUTTON_CLASS);
    playButton.addEventListener('click', () => this.start());
    buttons.appendChild(playButton);

    const pauseButton = document.createElement('a');
    pauseButton.href = 'javascript:void(0)';
    pauseButton.classList.add(BUTTON_CLASS);
    pauseButton.classList.add(PAUSE_BUTTON_CLASS);
    pauseButton.addEventListener('click', () => this.pause());
    buttons.appendChild(pauseButton);

    const stepForwardButton = document.createElement('a');
    stepForwardButton.href = 'javascript:void(0)';
    stepForwardButton.classList.add(BUTTON_CLASS);
    stepForwardButton.classList.add(STEP_FORWARD_BUTTON_CLASS);
    stepForwardButton.addEventListener('click', () => this.stepForward());
    buttons.appendChild(stepForwardButton);

    const loader = document.createElement('span');
    loader.classList.add(LOADER_CLASS);
    buttons.appendChild(loader);

    const loaderIcon = document.createElement('span');
    loaderIcon.classList.add(LOADER_ICON_CLASS);
    loader.appendChild(loaderIcon);

    this._loaderText = document.createElement('span');
    this._loaderText.classList.add(LOADER_TEXT_CLASS);
    loader.appendChild(this._loaderText);
  }
}