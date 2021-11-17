/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {projectPatternOnPointPath} from 'leaflet-polylinedecorator/src/patternUtils';

/** @typedef {import('./contour-proxy').Contour} Contour */
/** @typedef {GeoJSON.Feature<GeoJSON.Point, { value: number, angle: number }>} ContourLabel */

/**
 * see L.PolylineDecorator._getDirectionPoints
 * https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.PolylineDecorator.js#L129
 * @param {Contour[]} contours
 * @returns {ContourLabel[]}
 */
export function getContourLabels(contours) {
  const contourLabels = contours.map(contour => {
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