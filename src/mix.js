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
 * @param {[number, number, number, number]} x
 * @param {[number, number, number, number]} y
 * @param {number} a
 * @return {[number, number, number, number]}
 */
export function mix4(x, y, a) {
    return [
        mix(x[0], y[0], a),
        mix(x[1], y[1], a),
        mix(x[2], y[2], a),
        mix(x[3], y[3], a),
    ];
}