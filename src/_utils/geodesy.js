import { distance as geodesyDistance } from 'geodesy-fn/src/spherical';

// radius used by deck.gl, see https://github.com/visgl/deck.gl/blob/master/modules/core/src/viewports/globe-viewport.js#L10
export const DEFAULT_RADIUS = 6370972;

/**
 * @param {GeoJSON.Position} start
 * @param {GeoJSON.Position} destination
 * @returns {number}
 */
export function distance(start, destination) {
  return geodesyDistance(start, destination, DEFAULT_RADIUS);
};