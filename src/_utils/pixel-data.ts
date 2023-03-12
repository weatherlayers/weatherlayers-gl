import {ImageInterpolation} from './image-interpolation.js';
import type {ImageType} from './image-type.js';
import type {ImageUnscale} from './image-unscale.js';
import {TextureData, FloatData} from './data.js';
import {getPixelSmoothInterpolate} from './pixel.js';
import {hasPixelValue, getPixelMagnitudeValue} from './pixel-value.js';

export function getPixelMagnitudeData(image: TextureData, imageType: ImageType, imageUnscale: ImageUnscale): FloatData {
  const {width, height} = image;

  const magnitudeData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;

      const uvX = x / width;
      const uvY = y / height;
      const pixel = getPixelSmoothInterpolate(image, null, 0, ImageInterpolation.NEAREST, 0, uvX, uvY);
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