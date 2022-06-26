import {ImageType} from './image-type';
import {getPixelMagnitudeValue} from './pixel-value';

/** @typedef {import('./image-type').ImageType} ImageType */
/** @typedef {import('./data').FloatData} FloatData */

/**
 * @param {FloatData} image
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @returns {FloatData}
 */
export function getPixelMagnitudeData(image, imageType, imageUnscale) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  const magnitudeData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * bandsCount;
      const j = x + y * width;

      // raster_has_value
      if (isNaN(data[i])) {
        magnitudeData[j] = NaN;
        continue;
      }

      // raster_get_value
      const pixel = /** @type {[number, number]} */ ([data[i], data[i + 1]]);
      const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);

      magnitudeData[j] = value;
    }
  }

  return { data: magnitudeData, width, height };
}