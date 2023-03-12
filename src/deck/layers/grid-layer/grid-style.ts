import type {IconMapping} from '@deck.gl/layers/typed/icon-layer/icon-manager';
import arrowIconAtlas from './arrow.png';
import arrowIconMapping from './arrow.json';
import windBarbIconAtlas from './wind-barb.png';
import windBarbIconMapping from './wind-barb.json';

export enum GridStyle {
  VALUE = 'VALUE',
  ARROW = 'ARROW',
  WIND_BARB = 'WIND_BARB',
}

export const GRID_ICON_STYLES = new Map([
  [GridStyle.ARROW, {
    iconAtlas: arrowIconAtlas,
    iconMapping: arrowIconMapping as unknown as IconMapping,
  }],
  [GridStyle.WIND_BARB, {
    iconAtlas: windBarbIconAtlas,
    iconMapping: windBarbIconMapping as unknown as IconMapping,
    iconBounds: [0, 100 * 0.51444], // 100 kts to m/s
  }],
]);