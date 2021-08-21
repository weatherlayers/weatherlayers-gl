/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as d3Contours from 'd3-contour';
import lineclip from 'lineclip';
import {getUnprojectFunction} from './unproject';

/** @typedef {GeoJSON.LineString & { properties: { value: number }}} Contour */

/**
 * wrap data around the world by repeating the data in the west and east
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} bufferWest
 * @param {number} bufferEast
 * @returns {Float32Array}
 */
 function cylinder(data, width, height, bufferWest, bufferEast) {
  const result = [];
  for (let i = 0; i < height; i++) {
    const row = data.slice(i * width, (i + 1) * width);
    result.push(...row.slice(row.length - bufferWest, row.length));
    result.push(...row);
    result.push(...row.slice(0, bufferEast));
  }
  return result;
}

/**
 * box blur, average of 3x3 pixels
 * see https://en.wikipedia.org/wiki/Box_blur
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @returns {Float32Array}
 */
function blur(data, width, height) {
  const result = new Float32Array(data.length);
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (i >= 1 && i <= width - 2 && j >= 1 && j <= height - 2) {
        const values = [
          data[(i - 1) + (j - 1) * width], data[(i    ) + (j - 1) * width], data[(i + 1) + (j - 1) * width],
          data[(i - 1) + (j    ) * width], data[(i    ) + (j    ) * width], data[(i + 1) + (j    ) * width],
          data[(i - 1) + (j + 1) * width], data[(i    ) + (j + 1) * width], data[(i + 1) + (j - 1) * width],
        ];
        result[i + j * width] = values.reduce((acc, curr) => acc + curr, 0) / values.length;
      } else {
        result[i + j * width] = data[i + j * width];
      }
    }
  }
  return result;
}

/**
 * @param {GeoJSON.Position[]} line
 * @returns {GeoJSON.BBox}
 */
function getLineBbox(line) {
  const southWest = [
    Math.floor(Math.min(...line.map(x => x[0]))),
    Math.floor(Math.min(...line.map(x => x[1]))),
  ];
  const northEast = [
    Math.ceil(Math.max(...line.map(x => x[0]))),
    Math.ceil(Math.max(...line.map(x => x[1]))),
  ];
  const bbox = /** @type {[number, number, number, number]} */ ([southWest[0], southWest[1], northEast[0], northEast[1]]);
  return bbox;
}

/**
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} delta
 * @returns {Contour[]}
 */
function computeContours(data, width, height, delta) {
  const min = Array.from(data).reduce((curr, prev) => Math.min(curr, prev), Infinity);
  const max = Array.from(data).reduce((curr, prev) => Math.max(curr, prev), -Infinity);
  const minThreshold = Math.ceil(min / delta) * delta;
  const maxThreshold = Math.floor(max / delta) * delta;
  const thresholds = new Array((maxThreshold - minThreshold) / delta + 1).fill(() => undefined).map((_, i) => minThreshold + i * delta);

  // compute contours
  // d3-contours returns multipolygons with holes, framed around data borders
  let contours = d3Contours.contours().size([width, height]).thresholds(thresholds)(data);

  // transform contours from multipolygons with holes to separate lines
  contours = contours.map(contour => {
    const coordinates = contour.coordinates.flat();
    return coordinates.map(coordinates => {
      return { type: 'LineString', coordinates, properties: { value: contour.value }};
    });
  }).flat();

  // unframe contours by cutting the lines by data borders minus epsilon
  const epsilon = 0.000001; // anything > 0, < 1
  const unframeBounds = [epsilon, epsilon, width - epsilon, height - epsilon];
  contours = contours.map(contour => {
    const lines = lineclip.polyline(contour.coordinates, unframeBounds);
    return lines.map(line => {
      return { type: contour.type, coordinates: line, properties: contour.properties };
    });
  }).flat();

  // compute bbox
  contours = contours.map(contour => {
    const bbox = getLineBbox(contour.coordinates);
    return { type: contour.type, coordinates: contour.coordinates, bbox, properties: contour.properties };
  });

  // filter out too small contours
  const minPoints = 4; // found experimentally
  contours = contours.filter(contour => {
    const bbox = contour.bbox;
    return (bbox[2] - bbox[0] + 1) >= minPoints && (bbox[3] - bbox[1] + 1) >= minPoints;
  });

  return contours;
}

/**
 * @param {{ width: number, height: number, data: Float32Array }} imageData
 * @param {number} delta
 * @returns {Contour[]}
 */
export function getContours(imageData, delta) {
  let { width, height, data } = imageData;
  const unproject = getUnprojectFunction(width, height);

  const sew = true;
  let bufferWest = 0;
  let bufferEast = 0;
  if (sew) {
    // wrap data around the world by repeating the data in the west and east
    // prevents wrong points at the sew
    // see https://github.com/d3/d3-contour/issues/25
    bufferWest = 1;
    bufferEast = 1;
    data = cylinder(data, width, height, bufferWest, bufferEast);
    width += bufferWest + bufferEast;
  }

  // blur noisy data
  // see screenshot at https://gis.stackexchange.com/questions/386050/algorithm-to-find-low-high-atmospheric-pressure-systems-in-gridded-raster-data
  data = blur(data, width, height);

  // compute contours
  let contours = computeContours(data, width, height, delta);

  // transform pixel coordinates to geographical coordinates
  /** @type {(point: GeoJSON.Position) => GeoJSON.Position} */
  const removeBuffer = point => {
    point = [point[0] - bufferWest, point[1]];
    return point;
  };
  contours = contours.map(contour => {
    const coordinates = contour.coordinates.map(point => {
      point = removeBuffer(point);
      point = unproject(point);
      return point;
    })
    return { type: contour.type, coordinates, properties: contour.properties };
  })
  
  if (sew) {
    const bounds = /** @type {[number, number, number, number]} */ ([-180, -90, 180, 90]);
    contours = contours.map(contour => {
      const lines = lineclip.polyline(contour.coordinates, bounds);
      return lines.map(line => {
        return { type: contour.type, coordinates: line, properties: contour.properties };
      });
    }).flat();
  }

  return contours;
}