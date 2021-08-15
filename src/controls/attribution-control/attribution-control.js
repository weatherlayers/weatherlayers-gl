/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './attribution-control.css';
import { getStacCollectionAttribution } from '../../utils/stac';

/** @typedef {import('./attribution-control').AttributionConfig} AttributionConfig */

export class AttributionControl {
  /** @type {AttributionConfig} */
  config = undefined;
  /** @type {HTMLElement} */
  container = undefined;

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
   * @returns {void}
   */
  update(config) {
    if (!this.container) {
      return;
    }
    if (this.container.children.length && this.config.stacCollection === config.stacCollection) {
      return;
    }

    this.config = config;
    this.container.innerHTML = '';

    if (!this.config.stacCollection) {
      if (this.config.attribution) {
        this.container.innerHTML = `<div>${this.config.attribution}</div>`;
      }
      return;
    }

    this.container.innerHTML = `<div>Data by ${getStacCollectionAttribution(this.config.stacCollection)}</div>`;
  }
}