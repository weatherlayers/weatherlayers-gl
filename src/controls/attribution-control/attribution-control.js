/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './attribution-control.css';
import {loadStacCollection, getStacCollectionProducer} from '../../utils/client';

/** @typedef {import('./attribution-control').AttributionConfig} AttributionConfig */
/** @typedef {import('../../utils/stac').StacCollection} StacCollection */

export class AttributionControl {
  /** @type {AttributionConfig} */
  config = undefined;
  /** @type {HTMLElement} */
  container = undefined;
  /** @type {StacCollection} */
  stacCollection = undefined;

  /**
   * @param {AttributionConfig} [config]
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-attribution-control';

    this.update(this.config);

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
    this.container.innerHTML = '';

    if (!this.config.dataset) {
      if (this.config.attribution) {
        this.container.innerHTML = `<div>${this.config.attribution}</div>`;
      }
      return;
    }

    this.stacCollection = await loadStacCollection(this.config.dataset);

    const producer = getStacCollectionProducer(this.stacCollection);
    if (!producer) {
      return;
    }

    this.container.innerHTML = `<div><a href="${producer.url}">${producer.name}</a> via <a href="https://weatherlayers.com" class="esri-attribution__link">WeatherLayers</a></div>`;
  }
}