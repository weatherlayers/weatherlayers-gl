import {ImageType} from '../../../_utils/image-type';
import {getValue, getDirection} from '../../../_utils/data';
import {getProjectFunction} from '../../../_utils/project';
import {getPixelInterpolate} from '../../../_utils/pixel';

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
    const pixel1 = getPixelInterpolate(image, image2, imageInterpolate, imageWeight, point, 0);
    const pixel2 = getPixelInterpolate(image, image2, imageInterpolate, imageWeight, point, 1);
    const value = getValue(pixel1, pixel2, imageTypeVector);
    const direction = getDirection(pixel1, pixel2, imageTypeVector);
    if (isNaN(value)) {
      continue;
    }

    gridPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { value, direction }});
  }

  return gridPoints;
}