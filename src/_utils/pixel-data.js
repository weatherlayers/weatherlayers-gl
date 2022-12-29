import {ImageInterpolation} from './image-interpolation.js';
import {ImageType} from './image-type.js';
import {getPixelInterpolate} from './pixel.js';
import {hasPixelValue, getPixelMagnitudeValue} from './pixel-value.js';

/** @typedef {import('./data').TextureData} TextureData */
/** @typedef {import('./data').FloatData} FloatData */

/**
 * @param {TextureData} image
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @returns {FloatData}
 */
export function getPixelMagnitudeData(image, imageType, imageUnscale) {
  const {width, height} = image;

  const magnitudeData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;

      const point = [x, y];
      const pixel = getPixelInterpolate(image, null, ImageInterpolation.NEAREST, 0, point);
      if (!hasPixelValue(pixel, imageUnscale)) {
        magnitudeData[i] = NaN;
        continue;
      }

      const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
      magnitudeData[i] = value;
    }
  }

  return { data: magnitudeData, width, height };
}