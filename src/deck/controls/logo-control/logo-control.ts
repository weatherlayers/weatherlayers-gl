import {Control} from '../control.js';
import './logo-control.css';

export interface LogoControlConfig {}

const CONTROL_CLASS = 'weatherlayers-logo-control';

export class LogoControl extends Control<LogoControlConfig> {
  private _config: LogoControlConfig;
  private _container: HTMLElement | undefined = undefined;

  constructor(config: LogoControlConfig = {} as LogoControlConfig) {
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

  getConfig(): LogoControlConfig {
    return {...this._config};
  }

  setConfig(config: LogoControlConfig): void {
    if (!this._container) {
      return;
    }

    this._config = config;

    this._container.innerHTML = '';
  
    const a = document.createElement('a');
    a.href = 'https://weatherlayers.com';
    a.target = '_blank';
    a.ariaLabel = 'WeatherLayers';
    this._container.appendChild(a);
  }
}