/** @typedef {import('mapbox-gl')} mapboxgl */

/**
 * @param {mapboxgl.Map?} map
 * @return {number[]}
 */
export function getWorldOffsets(map) {
    if (!map) {
        return [0];
    }

    const worldOffsets = map.transform.getVisibleUnwrappedCoordinates({z: 0, x: 0, y: 0}).map(x => x.wrap).sort((a, b) => a - b);
    return worldOffsets.slice(1, worldOffsets.length - 1);
}