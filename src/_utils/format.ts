import type {UnitFormat} from './unit-format.js';

export function formatDatetime(value: string): string {
  if (!value) {
    return value;
  }

  const date = new Date(value);
  if (!date.getDate()) {
    return value;
  }

  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  const hour = `${date.getUTCHours()}`.padStart(2, '0');
  const minute = `${date.getUTCMinutes()}`.padStart(2, '0');
  const formattedValue = `${year}/${month}/${day} ${hour}:${minute}\xa0UTC`;
  return formattedValue;
}

export function formatValue(value: number, unitFormat: UnitFormat): string {
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