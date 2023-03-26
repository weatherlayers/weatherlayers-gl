import type {Color, DefaultProps} from '@deck.gl/core/typed';
import type {UnitFormat} from './unit-format.js';
import {formatValue} from './format.js';

export type TextFormatFunction = (value: number, unitFormat?: UnitFormat) => string;

export const DEFAULT_LINE_WIDTH: number = 1;
export const DEFAULT_LINE_COLOR: Color = [255, 255, 255, 51];
export const DEFAULT_TEXT_FONT_FAMILY: string = '"Helvetica Neue", Arial, Helvetica, sans-serif';
export const DEFAULT_TEXT_SIZE: number = 12;
export const DEFAULT_TEXT_COLOR: Color = [153, 153, 153, 255];
export const DEFAULT_TEXT_OUTLINE_WIDTH: number = 1;
export const DEFAULT_TEXT_OUTLINE_COLOR: Color = [13, 13, 13, 255];
export const DEFAULT_TEXT_FORMAT_FUNCTION: TextFormatFunction = formatValue;
export const DEFAULT_ICON_SIZE: number = 40;
export const DEFAULT_ICON_COLOR: Color = [255, 255, 255, 102];

// prefer default values over provided undefined values
// see https://github.com/visgl/deck.gl/blob/24dd30dbf32e10a40df9c57f1a5e85923f1ce785/modules/core/src/lifecycle/create-props.ts#L50
// TODO: report deck.gl bug
export function ensureDefaultProps<PropsT extends {}>(props: PropsT, defaultProps: DefaultProps<PropsT>): PropsT {
  const propsInstance = Object.create(props);
  for (const key in props) {
    if (props[key] === undefined && key in defaultProps) {
      const defaultProp = defaultProps[key] as any;
      if (defaultProp && 'value' in defaultProp) {
        propsInstance[key] = defaultProp.value;
      } else {
        propsInstance[key] = defaultProp;
      }
    }
  }
  return Object.freeze(propsInstance);
}