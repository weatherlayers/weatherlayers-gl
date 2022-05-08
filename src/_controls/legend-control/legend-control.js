import {parsePalette, colorRampCanvas} from 'cpt2js';
import './legend-control.css';
import {getClient} from '../../cloud-client/client';
import {formatValue, formatUnit} from '../../_utils/format';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('./legend-control').LegendConfig} LegendConfig */
/** @typedef {import('../../cloud-client/client').Client} Client */
/** @typedef {import('../../cloud-client/stac').StacCollection} StacCollection */

export class LegendControl {
  /** @type {LegendConfig} */
  config = undefined;
  /** @type {Client} */
  client = undefined;
  /** @type {HTMLElement} */
  container = undefined;
  /** @type {StacCollection} */
  stacCollection = undefined;
  /** @type {Palette} */
  stacCollectionPalette = undefined;

  /**
   * @param {LegendConfig} config
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

    if (!this.config.dataset) {
      this.container.innerHTML = '';
      return;
    }

    this.stacCollection = await this.client.loadStacCollection(this.config.dataset);
    this.stacCollectionPalette = await this.client.loadStacCollectionPalette(this.config.dataset);
    const palette = this.config.palette || this.stacCollectionPalette;
    const paletteScale = parsePalette(palette);
    const paletteDomain = paletteScale.domain();
    const paletteBounds = /** @type {[number, number]} */ ([paletteDomain[0], paletteDomain[paletteDomain.length - 1]]);
    const paletteCanvas = colorRampCanvas(paletteScale);
    const paletteCanvasDataUrl = paletteCanvas.toDataURL();

    const paddingY = 15;
    const unit = this.stacCollection.summaries.unit[0];

    this.container.innerHTML = '';
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

    const g = document.createElementNS(xmlns, 'g');
    g.style.transform = `translate(${paddingY}px, 22px)`;
    svg.appendChild(g);

    const image = document.createElementNS(xmlns, 'image');
    image.setAttribute('href', paletteCanvasDataUrl);
    image.setAttribute('width', `${this.config.width - 2 * paddingY}`);
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    g.appendChild(image);

    const ticks = document.createElementNS(xmlns, 'g');
    ticks.style.textAnchor = 'middle';
    g.appendChild(ticks);

    const delta = (paletteBounds[1] - paletteBounds[0]) / (this.config.ticksCount - 1);
    for (let i = 0; i < this.config.ticksCount; i++) {
      const value = paletteBounds[0] + i * delta;
      const formattedValue = formatValue(value, unit);

      const tick = document.createElementNS(xmlns, 'g');
      tick.style.transform = `translate(${(value - paletteBounds[0]) / (paletteBounds[1] - paletteBounds[0]) * (this.config.width - 2 * paddingY)}px, 0)`;
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