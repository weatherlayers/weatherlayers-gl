/**
 * @param {Float32Array} values
 * @return {boolean}
 */
export function hasValues(values) {
    return !isNaN(values[0]);
}