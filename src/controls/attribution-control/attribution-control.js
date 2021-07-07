/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './attribution-control.css';

export class AttributionControl {
  /** @type {string} */
  html = undefined;
  /** @type {HTMLElement} */
  container = undefined;

  /**
   * @param {string} html
   */
  constructor(html) {
    this.html = html;
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'attribution';

    this.update(this.html);

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
   * @param {string} html
   * @returns {void}
   */
  update(html) {
    if (!this.container) {
      return;
    }

    this.html = html;
    this.container.innerHTML = '';

    if (!html) {
      return;
    }

    this.container.innerHTML = `<div>${html}</div>`;
  }
}