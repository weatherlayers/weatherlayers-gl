import {Control} from '../control.js';
import './attribution-control.css';

export interface AttributionControlConfig {
  attribution: string;
}

const CONTROL_CLASS = 'weatherlayers-attribution-control';

export class AttributionControl extends Control<AttributionControlConfig> {
  private _config: AttributionControlConfig;
  private _container: HTMLElement | undefined = undefined;

  constructor(config: AttributionControlConfig = {} as AttributionControlConfig) {
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

  getConfig(): AttributionControlConfig {
    return {...this._config};
  }

  setConfig(config: AttributionControlConfig): void {
    if (!this._container) {
      return;
    }

    // validate config
    if (!config.attribution) {
      return;
    }

    // prevent update if no config changed
    if (
      this._container.children.length > 0 &&
      this._config.attribution === config.attribution
    ) {
      return;
    }

    this._config = config;
    const attribution = this._config.attribution;

    this._container.innerHTML = `<div>${attribution}</div>`;
  }
}