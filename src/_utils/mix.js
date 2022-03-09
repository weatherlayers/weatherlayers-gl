/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
export function mix(x, y, a) {
  return x * (1 - a) + y * a;
}