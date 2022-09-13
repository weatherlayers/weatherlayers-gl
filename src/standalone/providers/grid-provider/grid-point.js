import {ImageType} from '../../../_utils/image-type';
import {getProjectFunction} from '../../../_utils/project';
import {getPixelInterpolate} from '../../../_utils/pixel';
import {hasPixelValue, getPixelMagnitudeValue, getPixelDirectionValue} from '../../../_utils/pixel-value';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').TextureData} TextureData */
/** @typedef {{ value: number, direction: number }} GridPointProperties */

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {boolean} imageInterpolate
 * @param {number} imageWeight
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @param {GeoJSON.BBox} bounds
 * @param {GeoJSON.Position[]} positions
 * @returns {GeoJSON.FeatureCollection<GeoJSON.Point, GridPointProperties>}
 */
export function getGridPoints(image, image2, imageInterpolate, imageWeight, imageType, imageUnscale, bounds, positions) {
  const {width, height} = image;
  const project = getProjectFunction(width, height, bounds);

  const gridPoints = /** @type {GeoJSON.FeatureCollection<GeoJSON.Point, GridPointProperties>[]} */ ([]);
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

  return { type: 'FeatureCollection', features: gridPoints };
}