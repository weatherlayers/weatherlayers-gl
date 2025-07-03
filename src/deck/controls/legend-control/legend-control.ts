import {formatValue, formatUnit} from '../../_utils/format.js';
import type {UnitFormat} from '../../_utils/unit-format.js';
import {parsePalette, colorRampCanvas, type Palette} from '../../_utils/palette.js';
import {Control} from '../control.js';
import './legend-control.css';

export interface LegendControlConfig {
  width?: number;
  ticksCount?: number;
  title: string;
  unitFormat: UnitFormat;
  palette: Palette;
}

const DEFAULT_WIDTH = 300;
const DEFAULT_TICKS_COUNT = 6;

const CONTROL_CLASS = 'weatherlayers-legend-control';
const TEXT_CLASS = `${CONTROL_CLASS}__text`;

export class LegendControl extends Control<LegendControlConfig> {
  private _config: LegendControlConfig;
  private _container: HTMLElement | undefined = undefined;

  constructor(config: LegendControlConfig = {} as LegendControlConfig) {
    super();
    this._config = config;
  }

  protected onAdd(): HTMLElement {
    this._container = document.createElement('div');
    this._container.classList.add(CONTROL_CLASS);

    this.setConfig(this._config);

    return this._container;
  }

  protected onRemove(): void {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
      this._container = undefined;
    }
  }

  getConfig(): LegendControlConfig {
    return {...this._config};
  }

  setConfig(config: LegendControlConfig): void {
    if (!this._container) {
      return;
    }

    // validate config
    if (!config.title || !config.unitFormat || !config.palette) {
      return;
    }

    // prevent update if no config changed
    if (
      this._container.children.length > 0 &&
      this._config.width === config.width &&
      this._config.ticksCount === config.ticksCount &&
      this._config.title === config.title &&
      this._config.unitFormat === config.unitFormat &&
      this._config.palette === config.palette
    ) {
      return;
    }

    this._config = config;
    const width = this._config.width ?? DEFAULT_WIDTH;
    const ticksCount = this._config.ticksCount ?? DEFAULT_TICKS_COUNT;
    const title = this._config.title;
    const unitFormat = this._config.unitFormat;
    const palette = this._config.palette;
    const paletteScale = parsePalette(palette);
    const paletteDomain = paletteScale.domain() as unknown as number[];
    const paletteBounds = [paletteDomain[0], paletteDomain[paletteDomain.length - 1]] as const;
    const paletteCanvas = colorRampCanvas(paletteScale);
    const paletteCanvasDataUrl = paletteCanvas.toDataURL();

    this._container.innerHTML = '';
    this._container.style.width = `${width}px`;

    const div = document.createElement('div');
    this._container.appendChild(div);

    const header = document.createElement('header');
    div.appendChild(header);

    const text = document.createElement('span');
    text.classList.add(TEXT_CLASS);
    text.innerHTML = `${title} [${formatUnit(unitFormat)}]`;
    header.appendChild(text);

    const main = document.createElement('main');
    div.appendChild(main);

    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('height', '24px');
    svg.setAttribute('class', 'weatherlayers-legend-control__legend');
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