import type {PickingInfo} from '@deck.gl/core';
import {formatValueWithUnit, formatDirection} from '../../_utils/format.js';
import type {UnitFormat} from '../../_utils/unit-format.js';
import {DirectionType} from '../../_utils/direction-type.js';
import {DirectionFormat} from '../../_utils/direction-format.js';
import {Placement} from '../../_utils/placement.js';
import type {RasterPointProperties} from '../../_utils/raster-data.js';
import {Control} from '../control.js';
import './tooltip-control.css';

export interface TooltipControlConfig {
  unitFormat: UnitFormat;
  directionType?: DirectionType;
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
const FOLLOW_CURSOR_PLACEMENT_ATTRIBUTE = 'data-follow-cursor-placement';
const HAS_VALUE_CLASS = 'has-value';
const HAS_DIRECTION_CLASS = 'has-direction';

export class TooltipControl extends Control<TooltipControlConfig> {
  private _config: TooltipControlConfig;
  private _container: HTMLElement | undefined = undefined;
  private _value: HTMLElement | undefined = undefined;
  private _direction: HTMLElement | undefined = undefined;
  private _directionIcon: HTMLElement | undefined = undefined;
  private _directionText: HTMLElement | undefined = undefined;

  constructor(config: TooltipControlConfig = {} as TooltipControlConfig) {
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

  getConfig(): TooltipControlConfig {
    return {...this._config};
  }

  setConfig(config: TooltipControlConfig): void {
    if (!this._container) {
      return;
    }
    
    // validate config
    if (!config.unitFormat) {
      return;
    }

    // prevent update if no config changed
    if (
      this._container.children.length > 0 &&
      this._config.directionType === config.directionType &&
      this._config.directionFormat === config.directionFormat &&
      this._config.unitFormat === config.unitFormat &&
      this._config.followCursor === config.followCursor &&
      this._config.followCursorOffset === config.followCursorOffset &&
      this._config.followCursorPlacement === config.followCursorPlacement
    ) {
      return;
    }
    
    this._config = config;

    this._container.innerHTML = '';

    const div = document.createElement('div');
    this._container.appendChild(div);
  
    this._value = document.createElement('span');
    this._value.classList.add(VALUE_CLASS);
    div.appendChild(this._value);

    this._direction = document.createElement('span');
    this._direction.classList.add(DIRECTION_CLASS);
    div.appendChild(this._direction);

    this._directionIcon = document.createElement('span');
    this._directionIcon.classList.add(DIRECTION_ICON_CLASS);
    this._direction.appendChild(this._directionIcon);

    this._directionText = document.createElement('span');
    this._directionText.classList.add(DIRECTION_TEXT_CLASS);
    this._direction.appendChild(this._directionText);
  }

  update(rasterPointProperties: RasterPointProperties | undefined): void {
    if (!this._container || !this._value || !this._directionIcon || !this._directionText) {
      return;
    }

    const {value, direction} = rasterPointProperties ?? {};

    this._container.classList.toggle(FOLLOW_CURSOR_CLASS, this._config.followCursor ?? false);
    this._container.setAttribute(FOLLOW_CURSOR_PLACEMENT_ATTRIBUTE, this._config.followCursorPlacement ?? Placement.BOTTOM);
    this._container.classList.toggle(HAS_VALUE_CLASS, typeof value !== 'undefined');
    this._container.classList.toggle(HAS_DIRECTION_CLASS, typeof direction !== 'undefined');

    if (typeof value !== 'undefined') {
      this._value.innerHTML = formatValueWithUnit(value, this._config.unitFormat);
    } else {
      this._value.innerHTML = '';
    }

    if (typeof direction !== 'undefined') {
      this._directionIcon.style.transform = `rotate(${(direction + 180) % 360}deg)`;
      this._directionText.innerHTML = formatDirection(direction, this._config.directionType ?? DirectionType.INWARD, this._config.directionFormat ?? DirectionFormat.VALUE);
    } else {
      this._directionIcon.style.transform = '';
      this._directionText.innerHTML = '';
    }
  }

  updatePickingInfo(pickingInfo: PickingInfo & {raster?: RasterPointProperties}): void {
    if (!this._container || !this._value || !this._direction) {
      return;
    }

    if (!pickingInfo) {
      this.update(undefined);
      return;
    }

    this.update(pickingInfo.raster);
    const hasDirection = typeof pickingInfo.raster?.direction !== 'undefined';

    const div = this._container.firstChild! as HTMLElement;
    if (this._config.followCursor) {
      const divBounds = div.getBoundingClientRect();
      const valueBounds = this._value.getBoundingClientRect();

      // update position
      const followCursorOffset = this._config.followCursorOffset ?? 16;
      const followCursorPlacement = this._config.followCursorPlacement ?? Placement.BOTTOM;

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
      this._container.style.left = `${containerX}px`;
      this._container.style.top = `${containerY}px`;

      if (followCursorPlacement === Placement.BOTTOM || followCursorPlacement === Placement.TOP) {
        const divPaddingLeft = parseFloat(window.getComputedStyle(div).paddingLeft);
        const directionMarginLeft = parseFloat(window.getComputedStyle(this._direction).marginLeft);
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
      document.addEventListener('mousedown', () => this.update(undefined), {once: true});
    } else {
      this._container.style.left = '';
      this._container.style.top = '';
      div.style.left = '';
      div.style.top = '';
    }
  }
}