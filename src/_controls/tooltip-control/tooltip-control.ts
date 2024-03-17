import type { PickingInfo } from '@deck.gl/core/typed';
import { formatValueWithUnit, formatDirection } from '../../_utils/format.js';
import type { UnitFormat } from '../../_utils/unit-format.js';
import { DirectionFormat } from '../../_utils/direction-format.js';
import { Placement } from '../../_utils/placement.js';
import { RasterPointProperties } from '../../_utils/raster-data.js';
import { Control } from '../control.js';
import './tooltip-control.css';

export interface TooltipControlConfig {
  unitFormat: UnitFormat;
  directionFormat?: DirectionFormat;
  followCursor?: boolean;
  followCursorOffset?: number;
  followCursorPlacement?: Placement;
}

const CONTROL_CLASS = 'weatherlayers-tooltip-control';
const VALUE_CLASS = `${CONTROL_CLASS}__value`;
const DIRECTION_CLASS = `${CONTROL_CLASS}__direction`;
const DIRECTION_ICON_CLASS = `${CONTROL_CLASS}__direction-icon`;
const DIRECTION_TEXT_CLASS = `${CONTROL_CLASS}__direction-text`;
const FOLLOW_CURSOR_CLASS = 'follow-cursor';
const FOLLOW_CURSOR_PLACEMENT_CLASS = {
  [Placement.BOTTOM]: 'follow-cursor-placement-bottom',
  [Placement.TOP]: 'follow-cursor-placement-top',
  [Placement.RIGHT]: 'follow-cursor-placement-right',
  [Placement.LEFT]: 'follow-cursor-placement-left',
};
const HAS_VALUE_CLASS = 'has-value';
const HAS_DIRECTION_CLASS = 'has-direction';

export class TooltipControl extends Control<TooltipControlConfig> {
  #config: TooltipControlConfig;
  #container: HTMLElement | undefined = undefined;
  #value: HTMLElement | undefined = undefined;
  #direction: HTMLElement | undefined = undefined;
  #directionIcon: HTMLElement | undefined = undefined;
  #directionText: HTMLElement | undefined = undefined;

  constructor(config: TooltipControlConfig = {} as TooltipControlConfig) {
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

  getConfig(): TooltipControlConfig {
    return { ...this.#config };
  }

  setConfig(config: TooltipControlConfig): void {
    if (!this.#container) {
      return;
    }
    
    // validate config
    if (!config.unitFormat) {
      return;
    }

    // prevent update if no config changed
    if (
      this.#container.children.length > 0 &&
      this.#config.unitFormat === config.unitFormat
    ) {
      return;
    }
    
    this.#config = config;

    this.#container.innerHTML = '';
    this.#container.classList.toggle(FOLLOW_CURSOR_CLASS, this.#config.followCursor ?? false);
    this.#container.classList.add(FOLLOW_CURSOR_PLACEMENT_CLASS[this.#config.followCursorPlacement ?? Placement.BOTTOM]);

    const div = document.createElement('div');
    this.#container.appendChild(div);
  
    this.#value = document.createElement('span');
    this.#value.classList.add(VALUE_CLASS);
    div.appendChild(this.#value);

    this.#direction = document.createElement('span');
    this.#direction.classList.add(DIRECTION_CLASS);
    div.appendChild(this.#direction);

    this.#directionIcon = document.createElement('span');
    this.#directionIcon.classList.add(DIRECTION_ICON_CLASS);
    this.#direction.appendChild(this.#directionIcon);

    this.#directionText = document.createElement('span');
    this.#directionText.classList.add(DIRECTION_TEXT_CLASS);
    this.#direction.appendChild(this.#directionText);
  }

  update(rasterPointProperties: RasterPointProperties | undefined): void {
    if (!this.#container || !this.#value || !this.#directionIcon || !this.#directionText) {
      return;
    }

    const { value, direction } = rasterPointProperties ?? {};

    this.#container.classList.toggle(HAS_VALUE_CLASS, typeof value !== 'undefined');
    this.#container.classList.toggle(HAS_DIRECTION_CLASS, typeof direction !== 'undefined');

    if (typeof value !== 'undefined') {
      this.#value.innerHTML = formatValueWithUnit(value, this.#config.unitFormat);
    } else {
      this.#value.innerHTML = '';
    }

    if (typeof direction !== 'undefined') {
      this.#directionIcon.style.transform = `rotate(${(direction + 180) % 360}deg)`;
      this.#directionText.innerHTML = formatDirection(direction, this.#config.directionFormat ?? DirectionFormat.VALUE);
    } else {
      this.#directionIcon.style.transform = '';
      this.#directionText.innerHTML = '';
    }
  }

  updatePickingInfo(pickingInfo: PickingInfo & { raster?: RasterPointProperties }): void {
    if (!this.#container || !this.#value || !this.#direction) {
      return;
    }

    if (!pickingInfo) {
      this.update(undefined);
      return;
    }

    this.update(pickingInfo.raster);
    const hasDirection = typeof pickingInfo.raster?.direction !== 'undefined';

    if (this.#config.followCursor) {
      const div = this.#container.firstChild! as HTMLElement;
      const divBounds = div.getBoundingClientRect();
      const valueBounds = this.#value.getBoundingClientRect();

      // update position
      const followCursorOffset = this.#config.followCursorOffset ?? 16;
      const followCursorPlacement = this.#config.followCursorPlacement ?? Placement.BOTTOM;

      let containerX = pickingInfo.x;
      let containerY = pickingInfo.y;
      if (followCursorPlacement === Placement.BOTTOM) {
        containerY += followCursorOffset;
      } else if (followCursorPlacement === Placement.TOP) {
        containerY -= followCursorOffset;
      } else if (followCursorPlacement === Placement.RIGHT) {
        containerX += followCursorOffset;
      } else if (followCursorPlacement === Placement.LEFT) {
        containerX -= followCursorOffset;
      } else {
        throw new Error(`Invalid placement ${followCursorPlacement}`);
      }
      this.#container.style.left = `${containerX}px`;
      this.#container.style.top = `${containerY}px`;

      if (followCursorPlacement === Placement.BOTTOM || followCursorPlacement === Placement.TOP) {
        const divPaddingLeft = parseFloat(window.getComputedStyle(div).paddingLeft);
        const directionMarginLeft = parseFloat(window.getComputedStyle(this.#direction).marginLeft);
        const divX = -(divPaddingLeft + (hasDirection ? valueBounds.width + directionMarginLeft : valueBounds.width / 2));
        div.style.left = `${divX}px`;
      }
      if (followCursorPlacement === Placement.RIGHT || followCursorPlacement === Placement.LEFT) {
        const divY = -divBounds.height / 2;
        div.style.top = `${divY}px`;
      }

      if (followCursorPlacement === Placement.TOP) {
        const divY = -divBounds.height;
        div.style.top = `${divY}px`;
      }
      if (followCursorPlacement === Placement.LEFT) {
        const divX = -divBounds.width;
        div.style.left = `${divX}px`;
      }

      // hide on panning
      document.addEventListener('mousedown', () => this.update(undefined), { once: true });
    }
  }
}