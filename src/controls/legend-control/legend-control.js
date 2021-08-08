/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './legend-control.css';
import { formatValue } from '../../utils/value';
import { getStacCollectionTitle } from '../../utils/stac';

/** @typedef {import('./legend-control').LegendConfig} LegendConfig */

export class LegendControl {
  /** @type {LegendConfig} */
  config = undefined;
  /** @type {HTMLElement} */
  container = undefined;

  /**
   * @param {LegendConfig} config
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'legend';

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
   * @param {LegendConfig} config
   * @returns {void}
   */
  update(config) {
    if (!this.container) {
      return;
    }

    this.config = config;
    this.container.innerHTML = '';

    if (!config.colormapUrl) {
      return;
    }

    const div = document.createElement('div');
    this.container.appendChild(div);

    const xmlns = 'http://www.w3.org/2000/svg';
    const paddingY = 15;
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('width', `${config.width + 2 * paddingY}px`);
    svg.setAttribute('height', '50px');
    svg.style.display = 'block';
    div.appendChild(svg);

    const title = document.createElementNS(xmlns, 'text');
    title.innerHTML = getStacCollectionTitle(config.stacCollection, config.stacCollection.summaries.unit[0].name);
    title.style.fontWeight = 'bold';
    title.style.transform = `translate(${paddingY}px, 15px)`;
    svg.appendChild(title);

    const scale = document.createElementNS(xmlns, 'g');
    scale.style.transform = `translate(${paddingY}px, 22px)`;
    svg.appendChild(scale);

    const image = document.createElementNS(xmlns, 'image');
    image.setAttribute('href', config.colormapUrl);
    image.setAttribute('width', `${config.width}`);
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    scale.appendChild(image);

    const ticks = document.createElementNS(xmlns, 'g');
    ticks.style.textAnchor = 'middle';
    scale.appendChild(ticks);

    const bounds = config.colormapBounds;
    const delta = (bounds[1] - bounds[0]) / (config.ticksCount - 1);
    for (let i = 0; i < config.ticksCount; i++) {
      const value = bounds[0] + i * delta;
      const formattedValue = formatValue(value, config.stacCollection.summaries.unit[0]);

      const tick = document.createElementNS(xmlns, 'g');
      tick.style.transform = `translate(${(value - bounds[0]) / (bounds[1] - bounds[0]) * config.width}px, 0)`;
      ticks.appendChild(tick);

      const tickLine = document.createElementNS(xmlns, 'line');
      tickLine.setAttribute('y1', '0');
      tickLine.setAttribute('y2', '10');
      tickLine.style.stroke = 'currentColor';
      tick.appendChild(tickLine);

      const tickValue = document.createElementNS(xmlns, 'text');
      tickValue.innerHTML = `${formattedValue}`;
      tickValue.style.transform = 'translate(0, 22px)';
      tick.appendChild(tickValue);
    }
  }
}