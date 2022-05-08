import {GridStyle} from '../../../_utils';
import arrowIconAtlas from './arrow.png';
import arrowIconMapping from './arrow.json';
import windBarbIconAtlas from './wind-barb.png';
import windBarbIconMapping from './wind-barb.json';

export const GRID_ICON_STYLES = new Map([
  [GridStyle.ARROW, {
    iconAtlas: arrowIconAtlas,
    iconMapping: arrowIconMapping,
  }],
  [GridStyle.WIND_BARB, {
    iconAtlas: windBarbIconAtlas,
    iconMapping: windBarbIconMapping,
    iconBounds: [0, 100 * 0.51444], // 100 kts to m/s
  }],
]);