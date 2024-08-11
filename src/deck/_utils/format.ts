import { DirectionType } from './direction-type.js';
import { DirectionFormat } from './direction-format.js';
import type { UnitFormat } from '../../client/_utils/unit-format.js';

const CARDINALS = {
  [DirectionFormat.CARDINAL]: ['N', 'E', 'S', 'W'],
  [DirectionFormat.CARDINAL2]: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  [DirectionFormat.CARDINAL3]: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
};

export function formatValue(value: number, unitFormat: UnitFormat | null | undefined): string {
  if (!unitFormat) {
    return `${Math.round(value)}`;
  }
  const { scale = 1, offset = 0, decimals = 0 } = unitFormat;
  const formattedValue = scale * value + offset;
  const roundedFormattedValue = decimals ? Math.round(formattedValue * 10 ** decimals) / 10 ** decimals : Math.round(formattedValue);
  return `${roundedFormattedValue}`;
}

export function formatUnit(unitFormat: UnitFormat): string {
  const formattedUnit = unitFormat.unit.replace('^2', '²').replace('^3', '³');
  return formattedUnit;
}

export function formatValueWithUnit(value: number, unitFormat: UnitFormat): string {
  const formattedValue = formatValue(value, unitFormat);
  const formattedUnit = formatUnit(unitFormat);
  return `${formattedValue}\xa0${formattedUnit}`;
}
  
export function formatDirection(direction: number, directionType: DirectionType, directionFormat: DirectionFormat): string {
  if (directionType === DirectionType.OUTWARD) {
    direction += 180;
  }

  if (directionFormat === DirectionFormat.VALUE) {
    return `${Math.round(direction % 360)}°`;
  } else if (directionFormat === DirectionFormat.CARDINAL || directionFormat === DirectionFormat.CARDINAL2 || directionFormat === DirectionFormat.CARDINAL3) {
    const cardinals = CARDINALS[directionFormat];
    const cardinalDelta = 360 / cardinals.length;
    const index = Math.floor(((direction % 360) + (cardinalDelta / 2)) / cardinalDelta) % cardinals.length;
    return cardinals[index];
  } else {
    throw new Error('Invalid state');
  }
}