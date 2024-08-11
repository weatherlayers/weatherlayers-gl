import { Control } from '../control.js';
import './attribution-control.css';

export interface AttributionControlConfig {
  attribution: string;
}

const CONTROL_CLASS = 'weatherlayers-attribution-control';

export class AttributionControl extends Control<AttributionControlConfig> {
  #config: AttributionControlConfig;
  #container: HTMLElement | undefined = undefined;

  constructor(config: AttributionControlConfig = {} as AttributionControlConfig) {
    super();
    this.#config = config;
  }

  protected onAdd(): HTMLElement {
    this.#container = document.createElement('div');
    this.#container.classList.add(CONTROL_CLASS);

    this.setConfig(this.#config);

    return this.#container;
  }

  protected onRemove(): void {
    if (this.#container && this.#container.parentNode) {
      this.#container.parentNode.removeChild(this.#container);
      this.#container = undefined;
    }
  }

  getConfig(): AttributionControlConfig {
    return { ...this.#config };
  }

  setConfig(config: AttributionControlConfig): void {
    if (!this.#container) {
      return;
    }

    // validate config
    if (!config.attribution) {
      return;
    }

    // prevent update if no config changed
    if (
      this.#container.children.length > 0 &&
      this.#config.attribution === config.attribution
    ) {
      return;
    }

    this.#config = config;
    const attribution = this.#config.attribution;

    this.#container.innerHTML = `<div>${attribution}</div>`;
  }
}