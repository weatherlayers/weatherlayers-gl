import type {IconStyle} from '../../_utils/icon-style.js';
import arrowAtlas from './arrow.atlas.png';
import arrowMapping from './arrow.mapping.json';
import windBarbAtlas from './wind-barb.atlas.png';
import windBarbMapping from './wind-barb.mapping.json';

export const GridStyle = {
  VALUE: 'VALUE',
  ARROW: 'ARROW',
  WIND_BARB: 'WIND_BARB',
} as const;

export type GridStyle = (typeof GridStyle)[keyof typeof GridStyle];

export const GRID_ICON_STYLES = new Map<GridStyle, IconStyle>([
  [GridStyle.ARROW, {
    iconAtlas: arrowAtlas,
    iconMapping: arrowMapping,
  }],
  [GridStyle.WIND_BARB, {
    iconAtlas: windBarbAtlas,
    iconMapping: windBarbMapping,
    iconBounds: [0, 100 * 0.51444], // 100 kts to m/s
  }],
]);