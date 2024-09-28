import {projectPatternOnPointPath} from 'leaflet-polylinedecorator/src/patternUtils.js';

export interface ContourLabelProperties {
  value: number;
  angle: number;
}

function createContourLabel(position: GeoJSON.Position, properties: ContourLabelProperties): GeoJSON.Feature<GeoJSON.Point, ContourLabelProperties> {
  return {type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties};
}

// see https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.PolylineDecorator.js#L129
export function getContourLabels(contourLines: GeoJSON.Feature<GeoJSON.LineString, ContourLabelProperties>[]): GeoJSON.Feature<GeoJSON.Point, ContourLabelProperties>[] {
  const contourLabels = contourLines.map(contour => {
    const points = contour.geometry.coordinates.map(coordinate => {
      return {x: coordinate[0], y: coordinate[1]};
    });

    const directionPoints = projectPatternOnPointPath(points, {
      offset: {value: 0.5, isInPixels: false},
      endOffset: {value: 0.25, isInPixels: false},
      repeat: {value: 20, isInPixels: true}, // degrees
    });

    return directionPoints.map(directionPoint => {
      const {pt, heading} = directionPoint;
      const position = [pt.x, pt.y];
      const angle = heading - 90 + (heading > 180 ? -180 : 0); // auto-flip

      return createContourLabel(position, {value: contour.properties.value, angle});
    });
  }).flat();

  return contourLabels;
}