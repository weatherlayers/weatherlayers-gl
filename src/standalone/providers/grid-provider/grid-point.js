import {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import {ImageType} from '../../../_utils/image-type.js';
import {getProjectFunction} from '../../../_utils/project.js';
import {getPixelInterpolate} from '../../../_utils/pixel.js';
import {hasPixelValue, getPixelMagnitudeValue, getPixelDirectionValue} from '../../../_utils/pixel-value.js';

/** @typedef {import('../../../_utils/data').TextureData} TextureData */
/** @typedef {{ value: number, direction: number }} GridPointProperties */

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {ImageInterpolation} imageInterpolation
 * @param {number} imageWeight
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @param {GeoJSON.BBox} bounds
 * @param {GeoJSON.Position[]} positions
 * @returns {GeoJSON.FeatureCollection<GeoJSON.Point, GridPointProperties>}
 */
export function getGridPoints(image, image2, imageInterpolation, imageWeight, imageType, imageUnscale, bounds, positions) {
  const {width, height} = image;
  const project = getProjectFunction(width, height, bounds);

  const gridPoints = /** @type {GeoJSON.Feature<GeoJSON.Point, GridPointProperties>[]} */ ([]);
  for (let position of positions) {
    const point = project(position);

    const pixel = getPixelInterpolate(image, image2, imageInterpolation, imageWeight, point);
    if (!hasPixelValue(pixel, imageUnscale)) {
      continue;
    }

    const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
    const direction = getPixelDirectionValue(pixel, imageType, imageUnscale);

    gridPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { value, direction }});
  }

  return { type: 'FeatureCollection', features: gridPoints };
}