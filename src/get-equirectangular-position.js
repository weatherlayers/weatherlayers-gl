/** @typedef {import('mapbox-gl')} mapboxgl */

/**
 * @param {mapboxgl.LngLat} lngLat
 * @return {[number, number]}
 */
export function getEquirectangularPosition(lngLat) {
    return [
        (lngLat.lng + 180) / 360,
        1 - (lngLat.lat + 90) / 180,
    ];
}