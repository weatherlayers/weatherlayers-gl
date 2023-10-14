import { formatValueWithUnit, formatDirection } from '../../_utils/format.js';
import type { UnitFormat } from '../../_utils/unit-format.js';
import { RasterPointProperties } from '../../_utils/raster-data.js';
import { Control } from '../control.js';
import './tooltip-control.css';

export interface TooltipControlConfig {
  unitFormat: UnitFormat;
}

const CONTROL_CLASS = 'weatherlayers-tooltip-control';

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
  }

  update(rasterPointProperties?: RasterPointProperties): void {
    if (!this.#container) {
      return;
    }

    if (!rasterPointProperties) {
      this.#container.innerHTML = '';
      return;
    }
    
    const unitFormat = this.#config.unitFormat;

    const { value, direction } = rasterPointProperties;
    let tooltip = formatValueWithUnit(value, unitFormat);
    if (typeof direction !== 'undefined') {
      tooltip += `, ${formatDirection(direction)}`
    }

    this.#container.innerHTML = `<div>${tooltip}</div>`;
  }
}