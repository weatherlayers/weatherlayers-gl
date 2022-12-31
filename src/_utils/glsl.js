/**
 * @param {number[]} x
 * @param {number[]} y
 * @returns {number[]}
 */
export function add(x, y) { 
  return x.map((_, i) => x[i] + y[i]);
}

/**
 * @param {number[]} x
 * @param {number} y
 * @returns {number[]}
 */
export function mul(x, y) { 
  return x.map((_, i) => x[i] * y);
}

/**
 * @param {number[]} x
 * @param {number[]} y
 * @returns {number}
 */
export function dot(x, y) { 
  return x.map((_, i) => x[i] * y[i]).reduce((m, n) => m + n);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
export function mixOne(x, y, a) {
  return x * (1 - a) + y * a;
}

/**
 * @param {number[]} x
 * @param {number[]} y
 * @param {number} a
 * @return {number[]}
 */
 export function mix(x, y, a) {
  return x.map((_, i) => mixOne(x[i], y[i], a));
}