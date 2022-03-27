import {ImageType} from '../../../_utils/image-type';
import {mix} from '../../../_utils/mix';
import {getValue, getDirection} from '../../../_utils/data';
import {getProjectFunction} from '../../../_utils/project';
import {getPixel} from '../../../_utils/pixel';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').FloatData} FloatData */
/** @typedef {GeoJSON.Feature<GeoJSON.Point, { value: number, direction: number }>} GridPoint */

/**
 * @param {FloatData} image
 * @param {FloatData | null} image2
 * @param {boolean} imageInterpolate
 * @param {number} imageWeight
 * @param {ImageType} imageType
 * @param {GeoJSON.Position[]} positions
 * @param {GeoJSON.BBox} bounds
 * @returns {GridPoint[]}
 */
export function getGridPoints(image, image2, imageInterpolate, imageWeight, imageType, positions, bounds) {
  const {width, height} = image;

  const project = getProjectFunction(width, height, bounds);
  const imageTypeVector = imageType === ImageType.VECTOR;

  const gridPoints = /** @type {GridPoint[]} */ ([]);
  for (let position of positions) {
    const point = project(position);
    const pixel11 = getPixel(image, imageInterpolate, point[0], point[1], 0);
    const pixel12 = getPixel(image, imageInterpolate, point[0], point[1], 1);
    const pixel21 = image2 ? getPixel(image2, imageInterpolate, point[0], point[1], 0) : null;
    const pixel22 = image2 ? getPixel(image2, imageInterpolate, point[0], point[1], 1) : null;
    const pixel1 = pixel21 ? mix(pixel11, pixel21, imageWeight) : pixel11;
    const pixel2 = pixel22 ? mix(pixel12, pixel22, imageWeight) : pixel12;
    const value = getValue(pixel1, pixel2, imageTypeVector);
    const direction = getDirection(pixel1, pixel2, imageTypeVector);
    if (isNaN(value)) {
      continue;
    }

    gridPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { value, direction }});
  }

  return gridPoints;
}