import { getMercatorPosition } from './get-mercator-position.js';
import { texture2DBilinear } from "./texture-2d-bilinear.js";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number]} position
 * @return {[number, number, number, number]}
 */
export function getPositionValues(ctx, position) {
    // project from world position to texture position
    const texturePosition = getMercatorPosition(position);

    /** @type [number, number] */
    const wrappedTexturePosition = [(texturePosition[0] + 1) % 1, texturePosition[1]];

    const values = texture2DBilinear(ctx, wrappedTexturePosition);

    return values;
}