import {formatValueWithUnit, formatDirection} from '../../_utils/format';
import {Control} from '../control';
import './tooltip-control.css';

/** @typedef {import('./tooltip-control').TooltipConfig} TooltipConfig */
/** @typedef {import('./tooltip-control').TooltipHoverEvent} TooltipHoverEvent */

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
   * @param {TooltipHoverEvent | undefined} event
   * @returns {void}
   */
  update(event) {
    if (!this.container) {
      return;
    }

    if (!event) {
      this.container.innerHTML = '';
      return;
    }
    
    const unit = this.config.unit;
    const unitWithIncreasedPrecision = { ...unit, decimals: (unit.decimals ?? 0) + 1 };

    const {value, direction} = event;
    let tooltip = formatValueWithUnit(value, unitWithIncreasedPrecision);
    if (typeof direction !== 'undefined') {
      tooltip += `, ${formatDirection(direction)}`
    }

    this.container.innerHTML = `<div>${tooltip}</div>`;
  }
}