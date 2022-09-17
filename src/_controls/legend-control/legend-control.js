import {parsePalette, colorRampCanvas} from 'cpt2js';
import {formatValue, formatUnit} from '../../_utils/format';
import {Control} from '../control';
import './legend-control.css';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('./legend-control').LegendConfig} LegendConfig */

const DEFAULT_WIDTH = 300;
const DEFAULT_TICKS_COUNT = 6;

/**
 * @extends {Control<LegendConfig>}
 */
export class LegendControl extends Control {
  /** @type {LegendConfig} */
  config;
  /** @type {HTMLElement | undefined} */
  container = undefined;

  /**
   * @param {LegendConfig} [config]
   */
  constructor(config = {}) {
    super();
    this.config = config;
  }

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-legend-control';

    this.setConfig(this.config);

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
  setConfig(config) {
    if (!this.container) {
      return;
    }

    // validate config
    if (!config.title || !config.unitFormat || !config.palette) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.width === config.width &&
      this.config.ticksCount === config.ticksCount &&
      this.config.title === config.title &&
      this.config.unitFormat === config.unitFormat &&
      this.config.palette === config.palette
    ) {
      return;
    }

    this.config = config;
    const width = this.config.width || DEFAULT_WIDTH;
    const ticksCount = this.config.ticksCount || DEFAULT_TICKS_COUNT;
    const title = this.config.title;
    const unitFormat = this.config.unitFormat;
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

    const header = document.createElement('header');
    div.appendChild(header);

    const text = document.createElement('span');
    text.className = 'text';
    text.innerHTML = `${title} [${formatUnit(unitFormat)}]`;
    header.appendChild(text);

    const main = document.createElement('main');
    div.appendChild(main);

    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('height', '24px');
    svg.setAttribute('class', 'legend');
    main.appendChild(svg);

    const image = document.createElementNS(xmlns, 'image');
    image.setAttribute('href', paletteCanvasDataUrl);
    image.setAttribute('width', '100%');
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    svg.appendChild(image);

    const delta = (paletteBounds[1] - paletteBounds[0]) / (ticksCount - 1);
    for (let i = 0; i < ticksCount; i++) {
      const value = paletteBounds[0] + i * delta;
      const formattedValue = formatValue(value, unitFormat);

      const tick = document.createElementNS(xmlns, 'g');
      tick.style.transform = `translate(${(value - paletteBounds[0]) / (paletteBounds[1] - paletteBounds[0]) * 100}%, 0)`;
      svg.appendChild(tick);

      const tickLine = document.createElementNS(xmlns, 'line');
      tickLine.setAttribute('y1', '0');
      tickLine.setAttribute('y2', '10');
      tickLine.style.stroke = 'currentColor';
      if (i === 0) {
        tickLine.style.transform = 'translate(0.5px, 0)';
      } else if (i === ticksCount - 1) {
        tickLine.style.transform = 'translate(-0.5px, 0)';
      }
      tick.appendChild(tickLine);

      const tickValue = document.createElementNS(xmlns, 'text');
      tickValue.innerHTML = formattedValue;
      tickValue.setAttribute('x', '0');
      tickValue.setAttribute('y', '22');
      if (i === 0) {
        tickValue.style.textAnchor = 'start';
      } else if (i === ticksCount - 1) {
        tickValue.style.textAnchor = 'end';
      } else {
        tickValue.style.textAnchor = 'middle';
      }
      tick.appendChild(tickValue);
    }
  }
}