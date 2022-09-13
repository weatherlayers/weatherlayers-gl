import {projectPatternOnPointPath} from 'leaflet-polylinedecorator/src/patternUtils';

/** @typedef {import('./contour-line').ContourLineProperties} ContourLineProperties */
/** @typedef {{ value: number, angle: number }} ContourLabelProperties */

/**
 * see L.PolylineDecorator._getDirectionPoints
 * https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.PolylineDecorator.js#L129
 * @param {GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties>[]} contourLines
 * @returns {GeoJSON.Feature<GeoJSON.Point, ContourLabelProperties>[]}
 */
export function getContourLabels(contourLines) {
  const contourLabels = contourLines.map(contour => {
    const points = contour.geometry.coordinates.map(coordinate => {
      return { x: coordinate[0], y: coordinate[1] };
    });

    const directionPoints = projectPatternOnPointPath(points, {
      offset: { value: 0.5, isInPixels: false },
      endOffset: { value: 0.25, isInPixels: false },
      repeat: { value: 20, isInPixels: true }, // degrees
    });

    return directionPoints.map(directionPoint => {
      const {pt, heading} = directionPoint;
      const coordinate = [pt.x, pt.y];
      const angle = heading - 90 + (heading > 180 ? -180 : 0); // auto-flip

      return { type: 'Feature', geometry: { type: 'Point', coordinates: coordinate }, properties: { value: contour.properties.value, angle }};
    });
  }).flat();

  return contourLabels;
}