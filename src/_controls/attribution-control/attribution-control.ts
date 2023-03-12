import {Control} from '../control.js';
import './attribution-control.css';

export interface AttributionControlConfig {
  attribution: string;
}

export class AttributionControl extends Control<AttributionControlConfig> {
  config: AttributionControlConfig;
  container: HTMLElement | undefined = undefined;

  constructor(config: AttributionControlConfig = {} as AttributionControlConfig) {
    super();
    this.config = config;
  }

  onAdd(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'weatherlayers-attribution-control';

    this.setConfig(this.config);

    return this.container;
  }

  onRemove(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  setConfig(config: AttributionControlConfig): void {
    if (!this.container) {
      return;
    }

    // validate config
    if (!config.attribution) {
      return;
    }

    // prevent update if no config changed
    if (
      this.container.children.length > 0 &&
      this.config.attribution === config.attribution
    ) {
      return;
    }

    this.config = config;
    const attribution = this.config.attribution;

    this.container.innerHTML = `<div>${attribution}</div>`;
  }
}