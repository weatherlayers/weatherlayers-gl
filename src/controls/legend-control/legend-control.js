/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import './legend-control.css';

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
    svg.setAttribute('width', `${config.legendWidth + 2 * paddingY}px`);
    svg.setAttribute('height', '50px');
    svg.style.display = 'block';
    div.appendChild(svg);

    const title = document.createElementNS(xmlns, 'text');
    title.innerHTML = config.legendTitle;
    title.style.fontWeight = 'bold';
    title.style.transform = `translate(${paddingY}px, 15px)`;
    svg.appendChild(title);

    const scale = document.createElementNS(xmlns, 'g');
    scale.style.transform = `translate(${paddingY}px, 22px)`;
    svg.appendChild(scale);

    const image = document.createElementNS(xmlns, 'image');
    image.setAttribute('href', config.colormapUrl);
    image.setAttribute('width', `${config.legendWidth}`);
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    scale.appendChild(image);

    const ticks = document.createElementNS(xmlns, 'g');
    ticks.style.textAnchor = 'middle';
    scale.appendChild(ticks);

    const bounds = config.colorBounds;
    const delta = (bounds[1] - bounds[0]) / (config.legendTicksCount - 1);
    for (let i = 0; i < config.legendTicksCount; i++) {
      const value = bounds[0] + i * delta;
      const formattedValue = config.legendValueFormat?.(value) ?? value;
      const roundedFormattedValue = config.legendValueDecimals ? Math.round(formattedValue * 10 ** config.legendValueDecimals) / 10 ** config.legendValueDecimals : Math.round(formattedValue);

      const tick = document.createElementNS(xmlns, 'g');
      tick.style.transform = `translate(${(value - bounds[0]) / (bounds[1] - bounds[0]) * config.legendWidth}px, 0)`;
      ticks.appendChild(tick);

      const tickLine = document.createElementNS(xmlns, 'line');
      tickLine.setAttribute('y1', '0');
      tickLine.setAttribute('y2', '10');
      tickLine.style.stroke = 'currentColor';
      tick.appendChild(tickLine);

      const tickValue = document.createElementNS(xmlns, 'text');
      tickValue.innerHTML = `${roundedFormattedValue}`;
      tickValue.style.transform = 'translate(0, 22px)';
      tick.appendChild(tickValue);
    }
  }
}