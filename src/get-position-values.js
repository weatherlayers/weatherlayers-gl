import { texture2DBilinear } from "./texture-2d-bilinear.js";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number]} position
 * @return {[number, number, number, number]}
 */
export function getPositionValues(ctx, position) {
    /** @type [number, number] */
    const wrappedPosition = [(position[0] + 1) % 1, position[1]];

    const values = texture2DBilinear(ctx, wrappedPosition);

    return values;
}