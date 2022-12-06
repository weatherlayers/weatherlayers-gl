import {formatValue} from './format.js';

/** @typedef {import('./format').UnitFormat} UnitFormat */

export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_LINE_COLOR = [255, 255, 255, 51];
export const DEFAULT_TEXT_FONT_FAMILY = '"Helvetica Neue", Arial, Helvetica, sans-serif.js';
export const DEFAULT_TEXT_SIZE = 12;
export const DEFAULT_TEXT_COLOR = [153, 153, 153, 255];
export const DEFAULT_TEXT_OUTLINE_WIDTH = 1;
export const DEFAULT_TEXT_OUTLINE_COLOR = [13, 13, 13, 255];
export const DEFAULT_TEXT_FORMAT_FUNCTION = (/** @type {number} */ value, /** @type {UnitFormat | undefined} */ unitFormat) => unitFormat ? formatValue(value, unitFormat) : Math.round(value).toString();
export const DEFAULT_ICON_SIZE = 40;
export const DEFAULT_ICON_COLOR = [255, 255, 255, 102];