import {projectPatternOnPointPath} from 'leaflet-polylinedecorator/src/patternUtils.js';
import {ContourLineProperties} from './contour-line.js';

export interface ContourLabelProperties {
  value: number;
  angle: number;
}

// see https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.PolylineDecorator.js#L129
export function getContourLabels(contourLines: GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties>[]): GeoJSON.Feature<GeoJSON.Point, ContourLabelProperties>[] {
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

      return { type: 'Feature', geometry: { type: 'Point', coordinates: coordinate }, properties: { value: contour.properties.value, angle }} satisfies GeoJSON.Feature<GeoJSON.Point, ContourLabelProperties>;
    });
  }).flat();

  return contourLabels;
}