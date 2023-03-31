import type {UnitFormat} from './unit-format.js';

export function formatValue(value: number, unitFormat?: UnitFormat): string {
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
  const formattedValueWithUnit = `${formatValue(value, unitFormat)}\xa0${formatUnit(unitFormat)}`;
  return formattedValueWithUnit;
}
  
export function formatDirection(direction: number): string {
  const formattedDirection = `${Math.round(direction)}°`;
  return formattedDirection;
}