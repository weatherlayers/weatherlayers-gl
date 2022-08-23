/** @typedef {import('./unit-format').UnitFormat} UnitFormat */

/**
 * @param {string} value
 * @returns {string}
 */
export function formatDatetime(value) {
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

/**
 * @param {number} value
 * @param {UnitFormat} unitFormat
 * @returns {string}
 */
export function formatValue(value, unitFormat) {
  const { scale = 1, offset = 0, decimals = 0 } = unitFormat;
  const formattedValue = scale * value + offset;
  const roundedFormattedValue = decimals ? Math.round(formattedValue * 10 ** decimals) / 10 ** decimals : Math.round(formattedValue);
  return `${roundedFormattedValue}`;
}

/**
 * @param {UnitFormat} unitFormat
 * @returns {string}
 */
export function formatUnit(unitFormat) {
  const formattedUnit = unitFormat.unit.replace('^2', '²').replace('^3', '³');
  return formattedUnit;
}

/**
 * @param {number} value
 * @param {UnitFormat} unitFormat
 * @returns {string}
 */
export function formatValueWithUnit(value, unitFormat) {
  const formattedValueWithUnit = `${formatValue(value, unitFormat)}\xa0${formatUnit(unitFormat)}`;
  return formattedValueWithUnit;
}
  
/**
 * @param {number} direction
 * @returns {string}
 */
export function formatDirection(direction) {
  const formattedDirection = `${Math.round(direction)}°`;
  return formattedDirection;
}