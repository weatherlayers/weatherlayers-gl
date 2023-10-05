import { distance as geodesyDistance, destinationPoint as geodesyDestinationPoint, initialBearing } from 'geodesy-fn';

// radius used by deck.gl, see https://github.com/visgl/deck.gl/blob/master/modules/core/src/viewports/globe-viewport.js#L10
export const DEFAULT_RADIUS = 6370972;

export function distance(start: GeoJSON.Position, destination: GeoJSON.Position): number {
  return geodesyDistance(start, destination, DEFAULT_RADIUS);
}

export function destinationPoint(start: GeoJSON.Position, distance: number, bearing: number): GeoJSON.Position {
  return geodesyDestinationPoint(start, distance, bearing, DEFAULT_RADIUS);
}

export { initialBearing };