/** @typedef {import('mapbox-gl')} mapboxgl */

// see https://github.com/mapbox/mapbox-gl-js/blob/main/src/geo/mercator_coordinate.js

/**
 * @param {number} lng
 * @return {number}
 */
export function mercatorXfromLng(lng) {
    return (180 + lng) / 360;
}

/**
 * @param {number} lat
 * @return {number}
 */
export function mercatorYfromLat(lat) {
    return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
}

/**
 * @param {mapboxgl.LngLat} lngLat
 * @return {[number, number]}
 */
export function getMercatorPosition(lngLat) {
    return [
        mercatorXfromLng(lngLat.lng),
        mercatorYfromLat(lngLat.lat),
    ];
}