import {ImageType} from '../../../_utils/image-type';
import {getProjectFunction} from '../../../_utils/project';
import {getPixelInterpolate} from '../../../_utils/pixel';
import {hasPixelValue, getPixelMagnitudeValue, getPixelDirectionValue} from '../../../_utils/pixel-value';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').TextureData} TextureData */
/** @typedef {GeoJSON.Feature<GeoJSON.Point, { value: number, direction: number }>} GridPoint */

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {boolean} imageInterpolate
 * @param {number} imageWeight
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @param {GeoJSON.Position[]} positions
 * @param {GeoJSON.BBox} bounds
 * @returns {GridPoint[]}
 */
export function getGridPoints(image, image2, imageInterpolate, imageWeight, imageType, imageUnscale, positions, bounds) {
  const {width, height} = image;
  const project = getProjectFunction(width, height, bounds);

  const gridPoints = /** @type {GridPoint[]} */ ([]);
  for (let position of positions) {
    const point = project(position);

    const pixel = getPixelInterpolate(image, image2, imageInterpolate, imageWeight, point);
    if (!hasPixelValue(pixel, imageUnscale)) {
      continue;
    }

    const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
    const direction = getPixelDirectionValue(pixel, imageType, imageUnscale);

    gridPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { value, direction }});
  }

  return gridPoints;
}