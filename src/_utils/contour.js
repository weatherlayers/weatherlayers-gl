import * as d3Contours from 'd3-contour';
import lineclip from 'lineclip';
import {getUnprojectFunction} from './unproject';

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
  return new Float32Array(result);
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
 * @returns {{ coordinates: GeoJSON.Position[], value: number }[]}
 */
function computeContours(data, width, height, delta) {
  const min = Array.from(data).reduce((prev, curr) => !isNaN(curr) ? Math.min(prev, curr) : prev, Infinity);
  const max = Array.from(data).reduce((prev, curr) => !isNaN(curr) ? Math.max(prev, curr) : prev, -Infinity);
  const minThreshold = Math.ceil(min / delta) * delta;
  const maxThreshold = Math.floor(max / delta) * delta;
  const thresholds = new Array((maxThreshold - minThreshold) / delta + 1).fill(() => undefined).map((_, i) => minThreshold + i * delta);

  // compute contours
  // d3-contours returns multipolygons with holes, framed around data borders
  const originalContours = /** @type {(GeoJSON.MultiPolygon & { value: number })[]} */ (
    d3Contours.contours().size([width, height]).thresholds(thresholds)(data)
  );

  // transform contours from multipolygons with holes to separate lines
  let contours = originalContours.map(contour => {
    const coordinates = contour.coordinates.flat();
    return coordinates.map(coordinates => {
      return { coordinates, value: contour.value };
    });
  }).flat();

  // unframe contours by cutting the lines by data borders minus epsilon
  const epsilon = 0.000001; // anything > 0, < 1
  const unframeBounds = [epsilon, epsilon, width - epsilon, height - epsilon];
  contours = contours.map(contour => {
    const lines = /** @type {GeoJSON.Position[][]} */ (
      lineclip.polyline(contour.coordinates, unframeBounds)
    );
    return lines.map(line => {
      return { coordinates: line, value: contour.value };
    });
  }).flat();

  // compute bbox, filter out too small contours
  const minPoints = 4; // found experimentally
  contours = contours.filter(contour => {
    const bbox = getLineBbox(contour.coordinates);
    return (bbox[2] - bbox[0] + 1) >= minPoints && (bbox[3] - bbox[1] + 1) >= minPoints;
  });

  return contours;
}

/**
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} delta
 * @param {[number, number, number, number]} bounds
 * @returns {Float32Array}
 */
export function getContoursData(data, width, height, delta, bounds) {
  const repeat = bounds[0] === -180 && bounds[2] === 180;
  const unproject = getUnprojectFunction(width, height, bounds);

  let bufferWest = 0;
  let bufferEast = 0;
  if (repeat) {
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
    return { coordinates, value: contour.value };
  })
  
  if (repeat) {
    contours = contours.map(contour => {
      const lines = /** @type {GeoJSON.Position[][]} */ (
        lineclip.polyline(contour.coordinates, bounds)
      );
      return lines.map(line => {
        return { coordinates: line, value: contour.value };
      });
    }).flat();
  }

  const contoursData = new Float32Array([
    contours.length,
    ...contours.map(x => [x.coordinates.length, ...x.coordinates.flat(), x.value]).flat(),
  ]);

  return contoursData;
}