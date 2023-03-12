import {formatValueWithUnit, formatDirection} from '../../_utils/format.js';
import type {UnitFormat} from '../../_utils/unit-format.js';
import {RasterPickingInfo} from '../../_utils/raster-picking-info.js';
import {Control} from '../control.js';
import './tooltip-control.css';

export interface TooltipControlConfig {
  unitFormat: UnitFormat;
}

export class TooltipControl extends Control<TooltipControlConfig> {
  config: TooltipControlConfig;
  container: HTMLElement | undefined = undefined;

  constructor(config: TooltipControlConfig = {} as TooltipControlConfig) {
    super();
    this.config = config;
  }

  onAdd(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-tooltip-control';

    this.setConfig(this.config);

    return this.container;
  }

  onRemove(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  setConfig(config: TooltipControlConfig): void {
    if (!this.container) {
      return;
    }
    
    // validate config
    if (!config.unitFormat) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.unitFormat === config.unitFormat
    ) {
      return;
    }
    
    this.config = config;

    this.container.innerHTML = '';
  }

  update(rasterPickingInfo?: RasterPickingInfo): void {
    if (!this.container) {
      return;
    }

    if (!rasterPickingInfo) {
      this.container.innerHTML = '';
      return;
    }
    
    const unitFormat = this.config.unitFormat;

    const {value, direction} = rasterPickingInfo;
    let tooltip = formatValueWithUnit(value, unitFormat);
    if (typeof direction !== 'undefined') {
      tooltip += `, ${formatDirection(direction)}`
    }

    this.container.innerHTML = `<div>${tooltip}</div>`;
  }
}