/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
function mix(x, y, a) {
    return x * (1 - a) + y * a;
}

/**
 * @param {Uint8ClampedArray} x
 * @param {Uint8ClampedArray} y
 * @param {number} a
 * @return {Uint8ClampedArray}
 */
function mix4(x, y, a) {
    return new Uint8ClampedArray([
        mix(x[0], y[0], a),
        mix(x[1], y[1], a),
        mix(x[2], y[2], a),
        mix(x[3], y[3], a),
    ]);
}

/**
 * manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number]} position
 * @return {Uint8ClampedArray}
 */
export function texture2DBilinear(ctx, position) {
    const floorPosition = [
        Math.floor(position[0] * ctx.canvas.width),
        Math.floor(position[1] * ctx.canvas.height),
    ];
    const fractPosition = [
        (position[0] * ctx.canvas.width) % 1,
        (position[1] * ctx.canvas.height) % 1,
    ];
    const topLeft = ctx.getImageData(floorPosition[0], floorPosition[1], 1, 1).data;
    const topRight = ctx.getImageData(floorPosition[0] + 1, floorPosition[1], 1, 1).data;
    const bottomLeft = ctx.getImageData(floorPosition[0], floorPosition[1] + 1, 1, 1).data;
    const bottomRight = ctx.getImageData(floorPosition[0] + 1, floorPosition[1] + 1, 1, 1).data;
    const values = mix4(mix4(topLeft, topRight, fractPosition[0]), mix4(bottomLeft, bottomRight, fractPosition[0]), fractPosition[1]);

    return values;
}