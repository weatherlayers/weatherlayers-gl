import {formatValueWithUnit, formatDirection} from '../../_utils/format';
import {Control} from '../control';
import './tooltip-control.css';

/** @typedef {import('../../_utils/raster-picking-info').RasterPickingInfo} RasterPickingInfo */
/** @typedef {import('./tooltip-control').TooltipConfig} TooltipConfig */

export class TooltipControl extends Control {
  /** @type {TooltipConfig} */
  config;
  /** @type {HTMLElement | undefined} */
  container = undefined;

  /**
   * @param {TooltipConfig} [config]
   */
  constructor(config = {}) {
    super();
    this.config = config;
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-tooltip-control';

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
   * @param {TooltipConfig} config
   * @returns {void}
   */
  setConfig(config) {
    if (!this.container) {
      return;
    }

    // validate config
    if (!config.unit) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.unit === config.unit
    ) {
      return;
    }
    
    this.config = config;

    this.container.innerHTML = '';
  }

  /**
   * @param {RasterPickingInfo | undefined} rasterPickingInfo
   * @returns {void}
   */
  update(rasterPickingInfo) {
    if (!this.container) {
      return;
    }

    if (!rasterPickingInfo) {
      this.container.innerHTML = '';
      return;
    }
    
    const unit = this.config.unit;
    const unitWithIncreasedPrecision = { ...unit, decimals: (unit.decimals ?? 0) + 1 };

    const {value, direction} = rasterPickingInfo;
    let tooltip = formatValueWithUnit(value, unitWithIncreasedPrecision);
    if (typeof direction !== 'undefined') {
      tooltip += `, ${formatDirection(direction)}`
    }

    this.container.innerHTML = `<div>${tooltip}</div>`;
  }
}