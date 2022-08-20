import {formatValueWithUnit, formatDirection} from '../../_utils/format';
import './tooltip-control.css';

/** @typedef {import('./tooltip-control').TooltipConfig} TooltipConfig */

export class TooltipControl {
  /** @type {TooltipConfig} */
  config;
  /** @type {HTMLElement | undefined} */
  container = undefined;

  /**
   * @param {TooltipConfig} config
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-tooltip-control';

    this.update(this.config);

    this.config.deckgl.setProps({
      onHover: (/** @type {any} */ event) => this.onHover(event),
    });

    return this.container;
  }

  /**
   * @returns {void}
   */
  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;

      this.config.deckgl.setProps({
        onHover: undefined,
      });
    }
  }

  /**
   * @param {TooltipConfig} config
   * @returns {void}
   */
  update(config) {
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
      this.config.deckgl === config.deckgl &&
      this.config.unit === config.unit
    ) {
      return;
    }
    
    this.config = config;

    this.container.innerHTML = '';
  }

  /**
   * @param {any} event
   * @returns {void}
   */
  onHover(event) {
    if (!this.container) {
      return;
    }

    if (!event.raster) {
      this.container.innerHTML = '';
      return;
    }
    
    const unit = this.config.unit;
    const unitWithIncreasedPrecision = { ...unit, decimals: (unit.decimals ?? 0) + 1 };
    let tooltip = formatValueWithUnit(event.raster.value, unitWithIncreasedPrecision);
    
    if (typeof event.raster.direction !== 'undefined') {
      tooltip += `, ${formatDirection(event.raster.direction)}`
    }

    this.container.innerHTML = `<div>${tooltip}</div>`;
  }
}