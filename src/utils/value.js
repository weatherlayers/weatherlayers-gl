/** @type {(value: number) => number} */
const identity = value => value;

/**
 * @param {number} value
 * @param {{ bounds?: [number, number] }} options
 * @returns {number}
 */
export function unscaleValue(value, { bounds = [0, 1] } = {}) {
  const unscaledValue = bounds[0] + value * (bounds[1] - bounds[0]);
  return unscaledValue;
}

/**
 * @param {number} value
 * @param {{ formatter?: (value: number) => number, decimals?: number }} options
 * @returns {number}
 */
export function formatValue(value, { formatter = identity, decimals = 0 } = {}) {
  const formattedValue = formatter ? formatter(value) : value;
  const roundedFormattedValue = decimals ? Math.round(formattedValue * 10 ** decimals) / 10 ** decimals : Math.round(formattedValue);
  return roundedFormattedValue;
}

/**
 * @param {[number, number]} value
 * @param {{ bounds?: [number, number] }} options
 * @returns {[number, number]}
 */
export function unscaleVectorValue(value, { bounds = [0, 1] } = {}) {
  const unscaledVectorValue = /** @type {[number, number]} */ ([unscaleValue(value[0], { bounds }), unscaleValue(value[1], { bounds })]);
  return unscaledVectorValue;
}
  
/**
 * @param {[number, number]} value
 * @param {{ formatter?: (value: number) => number, decimals?: number }} options
 * @returns {[number, number]}
 */
export function formatVectorValue(value, { formatter = identity, decimals = 0 } = {}) {
  const formattedVectorValue = /** @type {[number, number]} */ ([formatValue(value[0], { formatter, decimals }), formatValue(value[1], { formatter, decimals })]);
  return formattedVectorValue;
}
  
/**
 * @param {[number, number]} value
 * @returns {number}
 */
export function formatVectorDirection(value) {
  const θ = Math.atan2(value[1], value[0]);
  const direction = ((90 - θ / Math.PI * 180) + 360) % 360;
  const formattedDirection = Math.round(direction);
  return formattedDirection;
}