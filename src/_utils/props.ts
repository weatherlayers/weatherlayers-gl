import type {Color} from '@deck.gl/core/typed';
import type {UnitFormat} from './unit-format.js';
import {formatValue} from './format.js';

export type TextFormatFunction = (value: number, unitFormat?: UnitFormat) => string;

export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_LINE_COLOR = [255, 255, 255, 51] satisfies Color;
export const DEFAULT_TEXT_FONT_FAMILY = '"Helvetica Neue", Arial, Helvetica, sans-serif';
export const DEFAULT_TEXT_SIZE = 12;
export const DEFAULT_TEXT_COLOR = [153, 153, 153, 255] satisfies Color;
export const DEFAULT_TEXT_OUTLINE_WIDTH = 1;
export const DEFAULT_TEXT_OUTLINE_COLOR = [13, 13, 13, 255] satisfies Color;
export const DEFAULT_TEXT_FORMAT_FUNCTION = ((value, unitFormat) => unitFormat ? formatValue(value, unitFormat) : Math.round(value).toString()) satisfies TextFormatFunction;
export const DEFAULT_ICON_SIZE = 40;
export const DEFAULT_ICON_COLOR = [255, 255, 255, 102] satisfies Color;