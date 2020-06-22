import { getEquirectangularPosition } from './get-equirectangular-position.js';

/** @typedef {import('mapbox-gl')} mapboxgl */

/**
 * @param {mapboxgl.Map?} map
 * @return {[[number, number], [number, number]]}
 */
export function getWorldBounds(map) {
    if (!map) {
        return [[0, 0], [1, 1]];
    }

    const bounds = map.getBounds();
    const topLeft = bounds.getNorthWest();
    const bottomRight = bounds.getSouthEast();

    /** @type [[number, number], [number, number]] */
    const worldBounds = [
        getEquirectangularPosition(topLeft),
        getEquirectangularPosition(bottomRight),
    ];

    return worldBounds;
}