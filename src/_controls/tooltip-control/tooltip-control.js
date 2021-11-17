/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './tooltip-control.css';
import {getClient} from '../../cloud-client/client';
import {formatValue, formatUnit, formatDirection} from '../../_utils/format';

/** @typedef {import('./tooltip-control').TooltipConfig} TooltipConfig */
/** @typedef {import('../../cloud-client/client').Client} Client */
/** @typedef {import('../../cloud-client/stac').StacCollection} StacCollection */

export class TooltipControl {
  /** @type {TooltipConfig} */
  config = undefined;
  /** @type {Client} */
  client = undefined;
  /** @type {HTMLElement} */
  container = undefined;
  /** @type {StacCollection} */
  stacCollection = undefined;

  /**
   * @param {TooltipConfig} config
   */
  constructor(config) {
    this.config = config;
    this.client = getClient();
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
   * @returns {Promise<void>}
   */
  async update(config) {
    if (!this.container) {
      return;
    }
    if (this.stacCollection && this.config.dataset === config.dataset) {
      return;
    }
    
    this.config = config;
    
    if (!this.config.dataset) {
      this.container.innerHTML = '';
      return;
    }

    this.stacCollection = await this.client.loadStacCollection(this.config.dataset);
    this.container.innerHTML = '';

    const div = document.createElement('div');
    this.container.appendChild(div);
  }

  /**
   * @param {any} event
   * @returns {void}
   */
  onHover(event) {
    const div = this.container.querySelector('div');
    div.innerHTML = '';
    
    if (typeof event.raster !== 'undefined') {
      div.innerHTML = `${formatValue(event.raster.value, this.stacCollection.summaries.unit[0])} ${formatUnit(this.stacCollection.summaries.unit[0].name)}`;
      
      if (typeof event.raster.direction !== 'undefined') {
        div.innerHTML += `, ${formatDirection(event.raster.direction)}`
      }
    }
  }
}