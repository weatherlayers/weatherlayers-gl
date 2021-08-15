/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './tooltip-control.css';
import { formatValue, formatDirection } from '../../utils/value';

/** @typedef {import('./tooltip-control').TooltipConfig} TooltipConfig */

export class TooltipControl {
  /** @type {TooltipConfig} */
  config = undefined;
  /** @type {HTMLElement} */
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
    this.config = config;
  }

  /**
   * @param {any} event
   * @returns {void}
   */
  onHover(event) {
    if (!this.container) {
      return;
    }

    this.container.innerHTML = '';

    const div = document.createElement('div');
    this.container.appendChild(div);
    
    if (typeof event.raster !== 'undefined') {
      div.innerHTML = formatValue(event.raster.value, this.config.stacCollection.summaries.unit[0]);
      
      if (typeof event.raster.direction !== 'undefined') {
        div.innerHTML += `, ${formatDirection(event.raster.direction)}`
      }
    }
  }
}