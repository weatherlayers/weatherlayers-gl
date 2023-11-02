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
const FOLLOW_CURSOR_CLASS = 'follow-cursor';

export class TooltipControl extends Control<TooltipControlConfig> {
  #config: TooltipControlConfig;
  #container: HTMLElement | undefined = undefined;

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
    this.#container.classList.toggle(FOLLOW_CURSOR_CLASS, this.#config.followCursor);
  }

  update(rasterPointProperties: RasterPointProperties | undefined): void {
    if (!this.#container) {
      return;
    }

    if (!rasterPointProperties) {
      this.#container.innerHTML = '';
      return;
    }

    const { value, direction } = rasterPointProperties;
    if (typeof value === 'undefined') {
      this.#container.innerHTML = '';
      return;
    }
  
    let tooltip = formatValueWithUnit(value, this.#config.unitFormat);
    if (typeof direction !== 'undefined') {
      tooltip += `, ${formatDirection(direction)}`
    }

    this.#container.innerHTML = `<div>${tooltip}</div>`;
  }

  updatePickingInfo(pickingInfo: PickingInfo & { raster?: RasterPointProperties }): void {
    if (!this.#container) {
      return;
    }

    if (!pickingInfo) {
      this.#container.innerHTML = '';
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
      document.addEventListener('mousedown', () => {
        if (this.#container) {
          this.#container.innerHTML = '';
        }
      }, { once: true });
    }
  }
}