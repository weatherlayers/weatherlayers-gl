/**
 * @param {Uint8ClampedArray} values
 * @return {boolean}
 */
export function hasValues(values) {
    return values[3] !== 0;
}