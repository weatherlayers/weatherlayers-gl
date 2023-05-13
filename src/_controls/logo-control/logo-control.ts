import { Control } from '../control.js';
import './logo-control.css';

export interface LogoControlConfig {}

export class LogoControl extends Control<LogoControlConfig> {
  #config: LogoControlConfig;
  #container: HTMLElement | undefined = undefined;

  constructor(config: LogoControlConfig = {} as LogoControlConfig) {
    super();
    this.#config = config;
  }

  protected onAdd(): HTMLElement {
    this.#container = document.createElement('div');
    this.#container.className = 'weatherlayers-logo-control';

    this.setConfig(this.#config);

    return this.#container;
  }

  protected onRemove(): void {
    if (this.#container && this.#container.parentNode) {
      this.#container.parentNode.removeChild(this.#container);
      this.#container = undefined;
    }
  }

  getConfig(): LogoControlConfig {
    return { ...this.#config };
  }

  setConfig(config: LogoControlConfig): void {
    if (!this.#container) {
      return;
    }

    this.#config = config;

    this.#container.innerHTML = '';
  
    const a = document.createElement('a');
    a.href = 'https://weatherlayers.com';
    a.target = '_blank';
    a.ariaLabel = 'WeatherLayers';
    this.#container.appendChild(a);
  }
}