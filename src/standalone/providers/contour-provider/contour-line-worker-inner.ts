import * as d3Contours from 'd3-contour';
import lineclip from 'lineclip';
import {blur} from '../../../_utils/blur.js';
import {TextureDataArray} from '../../../_utils/data.js';
import type {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import type {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';
import {getMagnitudeDataSmoothInterpolate} from '../../../_utils/pixel.js';
import {getUnprojectFunction} from '../../../_utils/project.js';

/**
 * wrap data around the world by repeating the data in the west and east
 */
function cylinder(data: Float32Array, width: number, height: number, bufferWest: number, bufferEast: number): Float32Array {
  const result = [];
  for (let i = 0; i < height; i++) {
    const row = data.slice(i * width, (i + 1) * width);
    result.push(...row.slice(row.length - bufferWest, row.length));
    result.push(...row);
    result.push(...row.slice(0, bufferEast));
  }
  return new Float32Array(result);
}

function getLineBbox(line: GeoJSON.Position[]): GeoJSON.BBox {
  const southWest = [
    Math.floor(Math.min(...line.map(x => x[0]))),
    Math.floor(Math.min(...line.map(x => x[1]))),
  ];
  const northEast = [
    Math.ceil(Math.max(...line.map(x => x[0]))),
    Math.ceil(Math.max(...line.map(x => x[1]))),
  ];
  const bbox: GeoJSON.BBox = [southWest[0], southWest[1], northEast[0], northEast[1]];
  return bbox;
}

function computeContours(data: Float32Array, width: number, height: number, interval: number): { coordinates: GeoJSON.Position[], value: number }[] {
  const min = Array.from(data).reduce((prev, curr) => !isNaN(curr) ? Math.min(prev, curr) : prev, Infinity);
  const max = Array.from(data).reduce((prev, curr) => !isNaN(curr) ? Math.max(prev, curr) : prev, -Infinity);
  const minThreshold = Math.ceil(min / interval) * interval;
  const maxThreshold = Math.floor(max / interval) * interval;
  const thresholds = new Array((maxThreshold - minThreshold) / interval + 1).fill(() => undefined).map((_, i) => minThreshold + i * interval);

  // compute contours with d3-contours
  // output: multipolygons with holes, framed around data borders
  const originalContours = d3Contours.contours().size([width, height]).thresholds(thresholds)(Array.from(data));

  // transform contours from multipolygons with holes to separate lines
  let contours = originalContours.map(contour => {
    const coordinates = contour.coordinates.flat();
    return coordinates.map(coordinates => {
      return { coordinates, value: contour.value };
    });
  }).flat();

  // unframe contours by cutting the lines by data borders minus epsilon
  const epsilon = 0.000001; // anything > 0, < 1
  const unframeBounds: GeoJSON.BBox = [epsilon, epsilon, width - epsilon, height - epsilon];
  contours = contours.map(contour => {
    const lines = lineclip.polyline(contour.coordinates, unframeBounds);
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

function getContourLineDataMain(data: Float32Array, width: number, height: number, bounds: GeoJSON.BBox, interval: number): Float32Array {
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

  // blur noisy data, TODO: replace by imageInterpolation on GPU
  data = blur(data, width, height);

  // compute contours
  let contours = computeContours(data, width, height, interval);

  // transform pixel coordinates to geographical coordinates
  contours = contours.map(contour => {
    const coordinates = contour.coordinates.map(point => {
      point = [point[0] - bufferWest, point[1]]; // remove buffer
      point = unproject(point);
      return point;
    })
    return { coordinates, value: contour.value };
  })
  
  if (repeat) {
    contours = contours.map(contour => {
      const lines = lineclip.polyline(contour.coordinates, bounds);
      return lines.map(line => {
        return { coordinates: line, value: contour.value };
      });
    }).flat();
  }

  const contourLineData = new Float32Array([
    contours.length,
    ...contours.map(x => [x.coordinates.length, ...x.coordinates.flat(), x.value]).flat(),
  ]);

  return contourLineData;
}

export function getContourLineData(data: TextureDataArray, data2: TextureDataArray | null, width: number, height: number, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageWeight: number, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, interval: number): Float32Array {
  const image = { data, width, height };
  const image2 = data2 ? { data: data2, width, height } : null;
  const magnitudeData = getMagnitudeDataSmoothInterpolate(image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale);
  const contourLineData = getContourLineDataMain(magnitudeData.data, width, height, bounds, interval);
  return contourLineData;
}