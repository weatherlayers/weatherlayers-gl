import { mix4 } from './mix.js';

/**
 * manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number]} position
 * @return {[number, number, number, number]}
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
    const topLeft = /** @type [number, number, number, number] */ (Array.from(ctx.getImageData(floorPosition[0], floorPosition[1], 1, 1).data));
    const topRight = /** @type [number, number, number, number] */ (Array.from(ctx.getImageData(floorPosition[0] + 1, floorPosition[1], 1, 1).data));
    const bottomLeft = /** @type [number, number, number, number] */ (Array.from(ctx.getImageData(floorPosition[0], floorPosition[1] + 1, 1, 1).data));
    const bottomRight = /** @type [number, number, number, number] */ (Array.from(ctx.getImageData(floorPosition[0] + 1, floorPosition[1] + 1, 1, 1).data));
    const values = mix4(mix4(topLeft, topRight, fractPosition[0]), mix4(bottomLeft, bottomRight, fractPosition[0]), fractPosition[1]);

    return values;
}