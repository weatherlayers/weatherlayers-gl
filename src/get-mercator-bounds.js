import { getMercatorPosition } from './get-mercator-position.js';

/**
 * @param {[[number, number], [number, number]]} bounds
 * @return {[[number, number], [number, number]]}
 */
export function getMercatorBounds(bounds) {
    const mercatorBounds = [
        getMercatorPosition(bounds[0]),
        getMercatorPosition(bounds[1]),
    ];
    /** @type [[number, number], [number, number]] */
    const visibleMercatorBounds = [
        [mercatorBounds[0][0], Math.min(Math.max(mercatorBounds[0][1], 0), 1)],
        [mercatorBounds[1][0], Math.min(Math.max(mercatorBounds[1][1], 0), 1)],
    ];

    return visibleMercatorBounds;
}