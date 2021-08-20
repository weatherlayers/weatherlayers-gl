/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as d3Contours from 'd3-contour';
import lineclip from 'lineclip';

/** @typedef {GeoJSON.LineString & { properties: { value: number, valueFormatted: string }}} Contour */
/** @typedef {'L' | 'H'} ExtremityType */
/** @typedef {GeoJSON.Point & { properties: { type: ExtremityType, value: number, valueFormatted: string }}} Extremity */

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
  const result = new Array(data.length);
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (i >= 1 && i <= width - 2 && j >= 1 && j <= height - 2) {
        const values = [
          data[(i - 1) + (j - 1) * width], data[(i + 0) + (j - 1) * width], data[(i + 1) + (j - 1) * width],
          data[(i - 1) + (j + 0) * width], data[(i + 0) + (j + 0) * width], data[(i + 1) + (j + 0) * width],
          data[(i - 1) + (j + 1) * width], data[(i + 0) + (j + 1) * width], data[(i + 1) + (j - 1) * width],
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
    Math.ceil(Math.max(...line.map(x => x[1])))
  ];
  const bbox = /** @type {[number, number, number, number]} */ ([southWest[0], southWest[1], northEast[0], northEast[1]]);
  return bbox;
}

/**
 * @param {GeoJSON.Position[]} line
 * @returns {boolean}
 */
function isClosedLine(line) {
  const firstPoint = line[0];
  const lastPoint = line[line.length - 1];
  return firstPoint && lastPoint && firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
}

/**
 * @param {GeoJSON.BBox} bbox1
 * @param {GeoJSON.BBox} bbox2
 * @returns {boolean}
 */
function isBboxInsideBbox(bbox1, bbox2) {
  return (
    bbox1[0] >= bbox2[0] &&
    bbox1[1] >= bbox2[1] &&
    bbox1[2] <= bbox2[2] &&
    bbox1[3] <= bbox2[3]
  );
}

/**
 * @param {GeoJSON.Position} point
 * @param {GeoJSON.BBox} bbox
 * @returns {boolean}
 */
function isPointInsideBbox(point, bbox) {
  return (
    point[0] >= bbox[0] &&
    point[1] >= bbox[1] &&
    point[0] <= bbox[2] &&
    point[1] <= bbox[3]
  );
}

/**
 * @param {number} value
 * @returns {string}
 */
function formatValue(value) {
  return `${Math.floor(value / 100)}`
}

/**
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} step
 * @returns {Contour[]}
 */
function getContours(data, width, height, step) {
  const min = Array.from(data).reduce((curr, prev) => Math.min(curr, prev), Infinity);
  const max = Array.from(data).reduce((curr, prev) => Math.max(curr, prev), -Infinity);
  const minThreshold = Math.ceil(min / step) * step;
  const maxThreshold = Math.floor(max / step) * step;
  const thresholds = new Array((maxThreshold - minThreshold) / step + 1).fill(() => undefined).map((_, i) => minThreshold + i * step);

  // compute contours
  // d3-contours returns multipolygons with holes, framed around data borders
  let contours = d3Contours.contours().size([width, height]).thresholds(thresholds)(data);

  // transform contours from multipolygons with holes to separate lines
  contours = contours.map(contour => {
    const coordinates = contour.coordinates.flat();
    return coordinates.map(coordinates => {
      const valueFormatted = formatValue(contour.value);
      return { type: 'LineString', coordinates, properties: { value: contour.value, valueFormatted }};
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
    const bbox = getLineBbox(contour.coordinates)
    return { type: contour.type, coordinates: contour.coordinates, bbox, properties: contour.properties }
  })

  // filter out too small contours
  const minPoints = 4; // found experimentally
  contours = contours.filter(contour => {
    const bbox = contour.bbox;
    return (bbox[2] - bbox[0] + 1) >= minPoints && (bbox[3] - bbox[1] + 1) >= minPoints;
  });

  return contours;
}

/**
 * @param {Float32Array} data
 * @param {number} width
 * @param {Contour} contour
 * @returns {Extremity}
 */
function getExtremity(data, width, contour) {
  const bbox = /** @type {GeoJSON.BBox} */ (contour.bbox);

  // guess extremity type by comparing the count of lower/igher points outside of contour bbox
  const outsideValues = [];
  for (let i = bbox[0]; i <= bbox[2]; i++) { // N
    outsideValues.push(data[i + (bbox[1] - 1) * width]);
  }
  for (let i = bbox[0]; i <= bbox[2]; i++) { // S
    outsideValues.push(data[i + (bbox[3] + 1) * width]);
  }
  for (let j = bbox[1]; j <= bbox[3]; j++) { // W
    outsideValues.push(data[(bbox[0] - 1) + j * width]);
  }
  for (let j = bbox[1]; j <= bbox[3]; j++) { // E
    outsideValues.push(data[(bbox[2] + 1) + j * width]);
  }
  let low = 0;
  let high = 0;
  outsideValues.forEach(value => {
    if (contour.properties.value < value) {
      low++;
    } else {
      high++;
    }
  });
  const type = low > high ? 'L' : 'H';

  // get extremity point and value as min/max inside of contour bbox
  let point;
  let value = type === 'L' ? Infinity : -Infinity;
  for (let i = bbox[0]; i <= bbox[2]; i++) {
    for (let j = bbox[1]; j <= bbox[3]; j++) {
      const dataPoint = [i, j];
      const dataValue = data[i + j * width];
      if (type === 'L' ? dataValue < value : dataValue > value) {
        point = dataPoint;
        value = dataValue;
      }
    }
  }
  if (!point) {
    throw new Error('Invalid state');
  }
  const valueFormatted = formatValue(value);

  return { type: 'Point', coordinates: point, properties: { type, value, valueFormatted }};
}

/**
 * @param {{ width: number, height: number, data: Float32Array }} imageData
 * @param {boolean} sew
 * @param {number} step
 * @returns {{ contours: Contour[], extremities: Extremity[] }}
 */
export function getContoursAndExtremities(imageData, sew, step) {
  const { width, height, data } = imageData;
  let contoursWidth = width;
  let contoursData = data;

  let bufferWest = 0;
  let bufferEast = 0;
  if (sew) {
    // wrap data around the world by repeating the data in the west and east
    // prevents wrong points at the sew
    // see https://github.com/d3/d3-contour/issues/25
    bufferWest = 1;
    bufferEast = 1;
    // larger buffer allows for finding extremities from innermost closed contours near the sew
    bufferWest = Math.floor(contoursWidth / 12);
    bufferEast = Math.floor(contoursWidth / 12);
    contoursData = cylinder(contoursData, contoursWidth, height, bufferWest, bufferEast);
    contoursWidth += bufferWest + bufferEast;
  }

  // blur the data to lower down the count of contours (and extremities) near the equator
  // see screenshot at https://gis.stackexchange.com/questions/386050/algorithm-to-find-low-high-atmospheric-pressure-systems-in-gridded-raster-data
  // console.time('blur');
  // for (let i = 0; i < 1; i++) {
  contoursData = blur(contoursData, contoursWidth, height);
  // }
  // console.timeEnd('blur');

  // compute contours
  let contours = getContours(contoursData, contoursWidth, height, step);

  // find innermost closed countours for extremities
  /** @type {Contour[]} */
  const innermostClosedContours = [];
  const closedContours = contours.filter(contour => isClosedLine(contour.coordinates));
  closedContours.forEach(contour => {
    const bbox = /** @type {GeoJSON.BBox} */ (contour.bbox);
    for (let i = 0; i < innermostClosedContours.length; i++) {
      const bbox2 = /** @type {GeoJSON.BBox} */ (innermostClosedContours[i].bbox);
      if (isBboxInsideBbox(bbox, bbox2)) {
        innermostClosedContours[i] = contour;
        return;
      } else if (isBboxInsideBbox(bbox2, bbox)) {
        return;
      }
    }
    innermostClosedContours.push(contour);
  });

  // find extremities
  let extremities = innermostClosedContours.map(contour => {
    return getExtremity(contoursData, contoursWidth, contour);
  });
  extremities = extremities.sort((a, b) => a.properties.value - b.properties.value);

  // transform pixel coordinates to geographical coordinates
  const origin = [-180, 90];
  const lngResolution = 360 / width;
  const latResolution = 180 / height;
  /** @type {(point: GeoJSON.Position) => GeoJSON.Position} */
  const removeBuffer = point => {
    point = [point[0] - bufferWest, point[1]];
    return point;
  };
  /** @type {(point: GeoJSON.Position) => GeoJSON.Position} */
  const unproject = point => {
    const i = point[0];
    const j = point[1];
    const lng = origin[0] + i * lngResolution;
    const lat = origin[1] + -j * latResolution;
    point = [lng, lat];
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
  extremities = extremities.map(extremity => {
    let point = extremity.coordinates;
    point = removeBuffer(point);
    point = unproject(point);
    return { type: extremity.type, coordinates: point, properties: extremity.properties };
  });
  
  if (sew) {
    const bounds = /** @type {[number, number, number, number]} */ ([-180, -90, 180, 90]);
    contours = contours.map(contour => {
      const lines = lineclip.polyline(contour.coordinates, bounds);
      return lines.map(line => {
        return { type: contour.type, coordinates: line, properties: contour.properties };
      });
    }).flat();
    extremities = extremities.filter(extremity => {
      return isPointInsideBbox(extremity.coordinates, bounds);
    });
  }

  return { contours, extremities };
}