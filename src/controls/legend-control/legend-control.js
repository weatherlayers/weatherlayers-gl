/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './legend-control.css';
import {loadStacCollection} from '../../utils/client';
import {linearColormap, colorRampUrl} from '../../utils/colormap';
import {formatValue, formatUnit} from '../../utils/value';

/** @typedef {import('./legend-control').LegendConfig} LegendConfig */
/** @typedef {import('../../utils/stac').StacCollection} StacCollection */

export class LegendControl {
  /** @type {LegendConfig} */
  config = undefined;
  /** @type {HTMLElement} */
  container = undefined;
  /** @type {StacCollection} */
  stacCollection = undefined;

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
    this.container.className = 'weatherlayers-legend-control';

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
      return;
    }

    this.stacCollection = await loadStacCollection(this.config.dataset);

    const paddingY = 15;
    const unit = this.stacCollection.summaries.unit[0];
    const colormapBreaks = this.stacCollection.summaries.raster.colormapBreaks;
    const colormapBounds = /** @type {[number, number]} */ ([colormapBreaks[0][0], colormapBreaks[colormapBreaks.length - 1][0]]);
    const colormapFunction = linearColormap(colormapBreaks);
    const colormapUrl = colorRampUrl(colormapFunction, colormapBounds);

    this.container.style.width = `${this.config.width}px`;

    const div = document.createElement('div');
    this.container.appendChild(div);

    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('width', `${this.config.width}px`);
    svg.setAttribute('height', '50px');
    svg.style.display = 'block';
    div.appendChild(svg);

    const title = document.createElementNS(xmlns, 'text');
    title.innerHTML = `${this.stacCollection.title} [${formatUnit(unit.name)}]`;
    title.style.fontWeight = 'bold';
    title.style.transform = `translate(${paddingY}px, 15px)`;
    svg.appendChild(title);

    const scale = document.createElementNS(xmlns, 'g');
    scale.style.transform = `translate(${paddingY}px, 22px)`;
    svg.appendChild(scale);

    const image = document.createElementNS(xmlns, 'image');
    image.setAttribute('href', colormapUrl);
    image.setAttribute('width', `${this.config.width - 2 * paddingY}`);
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    scale.appendChild(image);

    const ticks = document.createElementNS(xmlns, 'g');
    ticks.style.textAnchor = 'middle';
    scale.appendChild(ticks);

    const delta = (colormapBounds[1] - colormapBounds[0]) / (this.config.ticksCount - 1);
    for (let i = 0; i < this.config.ticksCount; i++) {
      const value = colormapBounds[0] + i * delta;
      const formattedValue = formatValue(value, unit);

      const tick = document.createElementNS(xmlns, 'g');
      tick.style.transform = `translate(${(value - colormapBounds[0]) / (colormapBounds[1] - colormapBounds[0]) * (this.config.width - 2 * paddingY)}px, 0)`;
      ticks.appendChild(tick);

      const tickLine = document.createElementNS(xmlns, 'line');
      tickLine.setAttribute('y1', '0');
      tickLine.setAttribute('y2', '10');
      tickLine.style.stroke = 'currentColor';
      tick.appendChild(tickLine);

      const tickValue = document.createElementNS(xmlns, 'text');
      tickValue.innerHTML = formattedValue;
      tickValue.style.transform = 'translate(0, 22px)';
      tick.appendChild(tickValue);
    }
  }
}