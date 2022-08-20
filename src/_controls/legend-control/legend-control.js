import {parsePalette, colorRampCanvas} from 'cpt2js';
import {formatValue, formatUnit} from '../../_utils/format';
import './legend-control.css';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('./legend-control').LegendConfig} LegendConfig */

const DEFAULT_WIDTH = 250;
const DEFAULT_TICKS_COUNT = 6;

const PADDING_Y = 15;

export class LegendControl {
  /** @type {LegendConfig} */
  config;
  /** @type {HTMLElement | undefined} */
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
   * @returns {void}
   */
  update(config) {
    if (!this.container) {
      return;
    }

    // validate config
    if (!config.title || !config.unit || !config.palette) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.width === config.width &&
      this.config.ticksCount === config.ticksCount &&
      this.config.title === config.title &&
      this.config.unit === config.unit &&
      this.config.palette === config.palette
    ) {
      return;
    }

    this.config = config;
    const width = this.config.width || DEFAULT_WIDTH;
    const ticksCount = this.config.ticksCount || DEFAULT_TICKS_COUNT;
    const title = this.config.title;
    const unit = this.config.unit;
    const palette = this.config.palette;
    const paletteScale = parsePalette(palette);
    const paletteDomain = paletteScale.domain();
    const paletteBounds = /** @type {[number, number]} */ ([paletteDomain[0], paletteDomain[paletteDomain.length - 1]]);
    const paletteCanvas = colorRampCanvas(paletteScale);
    const paletteCanvasDataUrl = paletteCanvas.toDataURL();

    this.container.innerHTML = '';
    this.container.style.width = `${width}px`;

    const div = document.createElement('div');
    this.container.appendChild(div);

    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('width', `${width}px`);
    svg.setAttribute('height', '50px');
    svg.style.display = 'block';
    div.appendChild(svg);

    const text = document.createElementNS(xmlns, 'text');
    text.innerHTML = `${title} [${formatUnit(unit)}]`;
    text.style.fontWeight = 'bold';
    text.style.transform = `translate(${PADDING_Y}px, 15px)`;
    svg.appendChild(text);

    const g = document.createElementNS(xmlns, 'g');
    g.style.transform = `translate(${PADDING_Y}px, 22px)`;
    svg.appendChild(g);

    const image = document.createElementNS(xmlns, 'image');
    image.setAttribute('href', paletteCanvasDataUrl);
    image.setAttribute('width', `${width - 2 * PADDING_Y}`);
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    g.appendChild(image);

    const ticks = document.createElementNS(xmlns, 'g');
    ticks.style.textAnchor = 'middle';
    g.appendChild(ticks);

    const delta = (paletteBounds[1] - paletteBounds[0]) / (ticksCount - 1);
    for (let i = 0; i < ticksCount; i++) {
      const value = paletteBounds[0] + i * delta;
      const formattedValue = formatValue(value, unit);

      const tick = document.createElementNS(xmlns, 'g');
      tick.style.transform = `translate(${(value - paletteBounds[0]) / (paletteBounds[1] - paletteBounds[0]) * (width - 2 * PADDING_Y)}px, 0)`;
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