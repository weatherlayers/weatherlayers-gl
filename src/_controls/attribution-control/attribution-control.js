import {Control} from '../control.js';
import './attribution-control.css';

/** @typedef {import('./attribution-control').AttributionConfig} AttributionConfig */

/**
 * @extends {Control<AttributionConfig>}
 */
export class AttributionControl extends Control {
  /** @type {AttributionConfig} */
  config;
  /** @type {HTMLElement | undefined} */
  container = undefined;

  /**
   * @param {AttributionConfig} [config]
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
    this.container.className = 'weatherlayers-attribution-control';

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
   * @param {AttributionConfig} config
   * @returns {void}
   */
  setConfig(config) {
    if (!this.container) {
      return;
    }

    // validate config
    if (!config.attribution) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.attribution === config.attribution
    ) {
      return;
    }

    this.config = config;
    const attribution = this.config.attribution;

    this.container.innerHTML = `<div>${attribution}</div>`;
  }
}