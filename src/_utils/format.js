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
  const formattedValue = `${year}/${month}/${day} ${hour}:${minute} UTC`;
  return formattedValue;
}

/**
 * @param {number} value
 * @param {{ offset?: number, scale?: number, decimals?: number }} options
 * @returns {string}
 */
export function formatValue(value, { offset = 0, scale = 1, decimals = 0 } = {}) {
  const formattedValue = (value + offset) * scale;
  const roundedFormattedValue = decimals ? Math.round(formattedValue * 10 ** decimals) / 10 ** decimals : Math.round(formattedValue);
  return `${roundedFormattedValue}`;
}
  
/**
 * @param {number} direction
 * @returns {string}
 */
export function formatDirection(direction) {
  const formattedDirection = `${Math.round(direction)}°`;
  return formattedDirection;
}

/**
 * @param {string} unit
 * @returns {string}
 */
export function formatUnit(unit) {
  const formattedUnit = unit.replace('^2', '²').replace('^3', '³');
  return formattedUnit;
}