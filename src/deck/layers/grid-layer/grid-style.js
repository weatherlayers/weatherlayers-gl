import arrowIconAtlas from './arrow.png';
import arrowIconMapping from './arrow.json';
import windBarbIconAtlas from './wind-barb.png';
import windBarbIconMapping from './wind-barb.json';

export const GridStyle = {
  VALUE: 'VALUE',
  ARROW: 'ARROW',
  WIND_BARB: 'WIND_BARB',
};

export const GRID_ICON_STYLES = new Map([
  [GridStyle.ARROW, {
    iconAtlas: arrowIconAtlas,
    iconMapping: arrowIconMapping
  }],
  [GridStyle.WIND_BARB, {
    iconAtlas: windBarbIconAtlas,
    iconMapping: windBarbIconMapping
  }],
]);