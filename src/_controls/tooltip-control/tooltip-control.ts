import type { PickingInfo } from '@deck.gl/core/typed';
import { formatValueWithUnit, formatDirection } from '../../_utils/format.js';
import type { UnitFormat } from '../../_utils/unit-format.js';
import { RasterPointProperties } from '../../_utils/raster-data.js';
import { Control } from '../control.js';
import './tooltip-control.css';

export interface TooltipControlConfig {
  unitFormat: UnitFormat;
  followCursor: boolean;
}

const FOLLOW_CURSOR_OFFSET = 16;

const CONTROL_CLASS = 'weatherlayers-tooltip-control';
const VALUE_CLASS = `${CONTROL_CLASS}__value`;
const DIRECTION_CLASS = `${CONTROL_CLASS}__direction`;
const DIRECTION_ICON_CLASS = `${CONTROL_CLASS}__direction-icon`;
const DIRECTION_TEXT_CLASS = `${CONTROL_CLASS}__direction-text`;
const FOLLOW_CURSOR_CLASS = 'follow-cursor';
const HAS_VALUE_CLASS = 'has-value';
const HAS_DIRECTION_CLASS = 'has-direction';

export class TooltipControl extends Control<TooltipControlConfig> {
  #config: TooltipControlConfig;
  #container: HTMLElement | undefined = undefined;
  #value: HTMLElement | undefined = undefined;
  #directionIcon: HTMLElement | undefined = undefined;
  #directionText: HTMLElement | undefined = undefined;

  constructor(config: TooltipControlConfig = {} as TooltipControlConfig) {
    super();
    this.#config = config;
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
    }
  }

  getConfig(): TooltipControlConfig {
    return { ...this.#config };
  }

  setConfig(config: TooltipControlConfig): void {
    if (!this.#container) {
      return;
    }
    
    // validate config
    if (!config.unitFormat) {
      return;
    }

    // prevent update if no config changed
    if (
      this.#container.children.length > 0 &&
      this.#config.unitFormat === config.unitFormat
    ) {
      return;
    }
    
    this.#config = config;

    this.#container.innerHTML = '';
    this.#container.classList.toggle(FOLLOW_CURSOR_CLASS, this.#config.followCursor ?? false);

    const div = document.createElement('div');
    this.#container.appendChild(div);
  
    this.#value = document.createElement('span');
    this.#value.classList.add(VALUE_CLASS);
    div.appendChild(this.#value);

    const direction = document.createElement('span');
    direction.classList.add(DIRECTION_CLASS);
    div.appendChild(direction);

    this.#directionIcon = document.createElement('span');
    this.#directionIcon.classList.add(DIRECTION_ICON_CLASS);
    direction.appendChild(this.#directionIcon);

    this.#directionText = document.createElement('span');
    this.#directionText.classList.add(DIRECTION_TEXT_CLASS);
    direction.appendChild(this.#directionText);
  }

  update(rasterPointProperties: RasterPointProperties | undefined): void {
    if (!this.#container || !this.#value || !this.#directionIcon || !this.#directionText) {
      return;
    }

    const { value, direction } = rasterPointProperties ?? {};

    this.#container.classList.toggle(HAS_VALUE_CLASS, typeof value !== 'undefined');
    this.#container.classList.toggle(HAS_DIRECTION_CLASS, typeof direction !== 'undefined');

    if (typeof value !== 'undefined') {
      this.#value.innerHTML = formatValueWithUnit(value, this.#config.unitFormat);
    } else {
      this.#value.innerHTML = '';
    }

    if (typeof direction !== 'undefined') {
      this.#directionIcon.style.transform = `rotate(${direction}deg)`;
      this.#directionText.innerHTML = formatDirection(direction);
    } else {
      this.#directionIcon.style.transform = '';
      this.#directionText.innerHTML = '';
    }
  }

  updatePickingInfo(pickingInfo: PickingInfo & { raster?: RasterPointProperties }): void {
    if (!this.#container) {
      return;
    }

    if (!pickingInfo) {
      this.update(undefined);
      return;
    }

    this.update(pickingInfo.raster);

    if (this.#config.followCursor) {
      // update position
      const tooltipX = pickingInfo.x - this.#container.clientWidth / 2;
      const tooltipY = pickingInfo.y + FOLLOW_CURSOR_OFFSET;
      this.#container.style.left = `${tooltipX}px`;
      this.#container.style.top = `${tooltipY}px`;

      // hide on panning
      document.addEventListener('mousedown', () => this.update(undefined), { once: true });
    }
  }
}