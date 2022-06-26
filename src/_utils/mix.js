/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
export function mix(x, y, a) {
  return x * (1 - a) + y * a;
}

/**
 * @param {number[]} x
 * @param {number[]} y
 * @param {number} a
 * @return {number[]}
 */
 export function mixAll(x, y, a) {
  return new Array(x.length).fill(undefined).map((_, band) => mix(x[band], y[band], a));
}