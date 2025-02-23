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
  #config: TimelineControlConfig;
  #container: HTMLElement | undefined = undefined;
  #currentDatetime: HTMLElement | undefined = undefined;
  #progressInput: HTMLInputElement | undefined = undefined;
  #loaderText: HTMLSpanElement | undefined = undefined;
  #loading: boolean = false;
  #animation: Animation;

  constructor(config: TimelineControlConfig = {} as TimelineControlConfig) {
    super();
    this.#config = config;
    this.#animation = new Animation({
      onUpdate: () => this.#animationUpdated(),
      fps: this.#config.fps ?? FPS,
    } satisfies AnimationConfig);
  }

  protected onAdd(): HTMLElement {
    this.#container = document.createElement('div');
    this.#container.classList.add(CONTROL_CLASS);

    this.setConfig(this.#config);

    return this.#container;
  }

  protected onRemove(): void {
    if (this.#container && this.#container.parentNode) {
      this.#container.parentNode.removeChild(this.#container);
      this.#container = undefined;
      this.#currentDatetime = undefined;
      this.#progressInput = undefined;
    }
  }

  get loading(): boolean {
    return this.#loading;
  }

  get running(): boolean {
    return this.#running;
  }

  get #running(): boolean {
    return this.#animation.running;
  }

  async toggle(running: boolean = !this.#running): Promise<void> {
    if (running) {
      return await this.start();
    } else {
      return this.pause();
    }
  }

  async start(): Promise<void> {
    if (!this.#container || this.#loading || this.#running) {
      return;
    }

    await this.#preload(this.#config.datetimes);

    this.#animation.start();
    this.#container.classList.add(RUNNING_CLASS);

    this.#updateProgress();
  }

  pause(): void {
    if (!this.#container || this.#loading || !this.#running) {
      return;
    }

    this.#animation.stop();
    this.#container.classList.remove(RUNNING_CLASS);

    this.#updateProgress();
  }

  stop(): void {
    if (!this.#container || !this.#progressInput || this.#loading || !this.#running) {
      return;
    }

    this.#animation.stop();
    this.#container.classList.remove(RUNNING_CLASS);

    this.#progressInput.valueAsNumber = 0;

    this.#updateProgress();
  }

  reset(): void {
    if (!this.#progressInput || this.#loading || this.#running) {
      return;
    }

    this.#progressInput.valueAsNumber = 0;

    this.#updateProgress();
  }

  async stepBackward(): Promise<void> {
    if (!this.#progressInput || this.#loading || this.#running) {
      return;
    }

    if (this.#progressInput.value !== this.#progressInput.min) {
      this.#progressInput.stepDown();
    } else {
      this.#progressInput.value = this.#progressInput.max;
    }

    await this.#preload(this.#startEndDatetimes);

    this.#updateProgress();
  }

  async stepForward(): Promise<void> {
    if (!this.#progressInput || this.#loading || this.#running) {
      return;
    }

    if (this.#progressInput.value !== this.#progressInput.max) {
      this.#progressInput.stepUp();
    } else {
      this.#progressInput.value = this.#progressInput.min;
    }

    await this.#preload(this.#startEndDatetimes);

    this.#updateProgress();
  }

  get #startEndDatetimes(): DatetimeISOString[] {
    if (!this.#progressInput) {
      return [];
    }

    const startDatetime = this.#config.datetimes[Math.floor(this.#progressInput.valueAsNumber)];
    const endDatetime = this.#config.datetimes[Math.ceil(this.#progressInput.valueAsNumber)];
    if (startDatetime === endDatetime) {
      return [startDatetime];
    } else {
      return [startDatetime, endDatetime];
    }
  }

  #updateProgress(): void {
    if (!this.#progressInput || !this.#currentDatetime) {
      return;
    }
    
    const startDatetime = this.#config.datetimes[Math.floor(this.#progressInput.valueAsNumber)];
    const endDatetime = this.#config.datetimes[Math.ceil(this.#progressInput.valueAsNumber)];
    const ratio = this.#progressInput.valueAsNumber % 1;
    const datetime = interpolateDatetime(startDatetime, endDatetime, ratio);
    
    this.#config.datetime = datetime;

    const datetimeFormatFunction = this.#config.datetimeFormatFunction ?? formatDatetime;
    this.#currentDatetime.innerHTML = datetimeFormatFunction(datetime);

    if (this.#config.onUpdate) {
      this.#config.onUpdate(datetime);
    }
  }

  async #progressInputClicked(): Promise<void> {
    if (this.#loading || this.#running) {
      return;
    }

    await this.#preload(this.#startEndDatetimes);

    this.#updateProgress();
  }

  #animationUpdated(): void {
    if (!this.#progressInput || this.#loading || !this.#running) {
      return;
    }

    if (this.#progressInput.value !== this.#progressInput.max) {
      this.#progressInput.stepUp();
    } else {
      this.#progressInput.value = this.#progressInput.min;
    }

    this.#updateProgress();
  }

  async #preload(datetimes: DatetimeISOString[]): Promise<void> {
    if (!this.#container || !this.#loaderText || !this.#config.onPreload) {
      return;
    }

    this.#loading = true;
    this.#container.classList.add(LOADING_CLASS);

    const promises = this.#config.onPreload(datetimes);
    if (Array.isArray(promises)) {
      let successCount = 0;
      const updateLoaderText = () => {
        this.#loaderText!.innerHTML = `Loading... ${successCount}/${promises.length}`;
      };
      updateLoaderText();
      for (let promise of promises) {
        promise.then(() => {
          successCount++;
          updateLoaderText();
        });
      }
      await Promise.all(promises);
      this.#loaderText.innerHTML = '';
    } else {
      this.#loaderText.innerHTML = 'Loading...';
      await promises;
      this.#loaderText.innerHTML = '';
    }

    this.#loading = false;
    this.#container.classList.remove(LOADING_CLASS);
  }

  getConfig(): TimelineControlConfig {
    return {...this.#config};
  }

  setConfig(config: TimelineControlConfig): void {
    if (!this.#container) {
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
      this.#container.children.length > 0 &&
      this.#config.width === config.width &&
      this.#config.datetimes.length === config.datetimes.length &&
      this.#config.datetimes.every((datetime, i) => datetime === config.datetimes[i]) &&
      this.#config.datetime === config.datetime &&
      this.#config.datetimeInterpolate === config.datetimeInterpolate &&
      this.#config.datetimeFormatFunction === config.datetimeFormatFunction &&
      this.#config.onPreload === config.onPreload &&
      this.#config.onUpdate === config.onUpdate
    ) {
      return;
    }

    this.#config = config;
    const width = this.#config.width ?? DEFAULT_WIDTH;
    const datetimes = this.#config.datetimes;
    const datetime = this.#config.datetime;
    const datetimeInterpolate = this.#config.datetimeInterpolate ?? false;
    const datetimeFormatFunction = this.#config.datetimeFormatFunction ?? formatDatetime;

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

    this.#container.innerHTML = '';
    this.#container.style.width = `${width}px`;

    const div = document.createElement('div');
    this.#container.appendChild(div);

    const header = document.createElement('header');
    div.appendChild(header);

    this.#currentDatetime = document.createElement('span');
    this.#currentDatetime.classList.add(CURRENT_DATETIME_CLASS);
    this.#currentDatetime.innerHTML = datetimeFormatFunction(datetime);
    header.appendChild(this.#currentDatetime);

    const main = document.createElement('main');
    div.appendChild(main);
    
    const progressInputTicksId = `${PROGRESS_INPUT_CLASS}-ticks-${randomString()}`;
    this.#progressInput = document.createElement('input');
    this.#progressInput.classList.add(PROGRESS_INPUT_CLASS);
    this.#progressInput.type = 'range';
    this.#progressInput.min = '0';
    this.#progressInput.max = `${datetimes.length - 1}`;
    this.#progressInput.step = `${progressInputStep}`;
    this.#progressInput.valueAsNumber = progressInputValue;
    this.#progressInput.setAttribute('list', progressInputTicksId);
    this.#progressInput.addEventListener('input', () => this.#progressInputClicked());
    main.appendChild(this.#progressInput);

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

    this.#loaderText = document.createElement('span');
    this.#loaderText.classList.add(LOADER_TEXT_CLASS);
    loader.appendChild(this.#loaderText);
  }
}