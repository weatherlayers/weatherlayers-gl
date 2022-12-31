import {ImageType} from './image-type.js';
import {mixOne} from './glsl.js';

/**
 * @param {number[]} pixel
 * @param {[number, number] | null} imageUnscale
 * @returns {boolean}
 */
export function hasPixelValue(pixel, imageUnscale) {
  if (imageUnscale) {
    return pixel[3] == 255;
  } else {
    return !isNaN(pixel[0]);
  }
}

/**
 * @param {number[]} pixel
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @returns {number}
 */
function getPixelScalarValue(pixel, imageType, imageUnscale) {
  if (imageType === ImageType.VECTOR) {
    return 0.;
  } else {
    if (imageUnscale) {
      return mixOne(imageUnscale[0], imageUnscale[1], pixel[0] / 255);
    } else {
      return pixel[0];
    }
  }
}

/**
 * @param {number[]} pixel
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @returns {[number, number]}
 */
function getPixelVectorValue(pixel, imageType, imageUnscale) {
  if (imageType === ImageType.VECTOR) {
    if (imageUnscale) {
      return [
        mixOne(imageUnscale[0], imageUnscale[1], pixel[0] / 255),
        mixOne(imageUnscale[0], imageUnscale[1], pixel[1] / 255)
      ];
    } else {
      return [pixel[0], pixel[1]];
    }
  } else {
    return [NaN, NaN];
  }
}

/**
 * @param {number[]} pixel
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @returns {number}
 */
export function getPixelMagnitudeValue(pixel, imageType, imageUnscale) {
  if (imageType === ImageType.VECTOR) {
    const value = getPixelVectorValue(pixel, imageType, imageUnscale);
    return Math.hypot(value[0], value[1]);
  } else {
    return getPixelScalarValue(pixel, imageType, imageUnscale);
  }
}
  
/**
 * @param {number[]} pixel
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @returns {number}
 */
export function getPixelDirectionValue(pixel, imageType, imageUnscale) {
  if (imageType === ImageType.VECTOR) {
    const value = getPixelVectorValue(pixel, imageType, imageUnscale);
    return ((360 - (Math.atan2(value[1], value[0]) / Math.PI * 180 + 180)) - 270) % 360;
  } else {
    return NaN;
  }
}