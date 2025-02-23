import {ImageType} from './image-type.js';
import type {ImageUnscale} from './image-unscale.js';
import {mixOne} from './glsl.js';

type VectorValue = [u: number, v: number];

export function hasPixelValue(pixel: number[], imageUnscale: ImageUnscale): boolean {
  if (imageUnscale) {
    // pixel[3] === 255 causes incorrect nodata pixels in Safari, because Canvas.getImageData returns different data from the original image, with lower values
    // - this happened in 2023.10.2, fixed in 2023.10.3, reverted in 2024.1.0, it's not happening anymore, why?
    // anything smaller causes interpolated nodata edges with linear interpolation
    // pixel[3] >= 255 because sometimes the original value is slightly larger (255.00000000000003)
    return pixel[3] >= 255;
  } else {
    return !isNaN(pixel[0]);
  }
}

function getPixelScalarValue(pixel: number[], imageType: ImageType, imageUnscale: ImageUnscale): number {
  if (imageType === ImageType.VECTOR) {
    return 0;
  } else {
    if (imageUnscale) {
      return mixOne(imageUnscale[0], imageUnscale[1], pixel[0] / 255);
    } else {
      return pixel[0];
    }
  }
}

function getPixelVectorValue(pixel: number[], imageType: ImageType, imageUnscale: ImageUnscale): VectorValue {
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

export function getPixelMagnitudeValue(pixel: number[], imageType: ImageType, imageUnscale: ImageUnscale): number {
  if (imageType === ImageType.VECTOR) {
    const value = getPixelVectorValue(pixel, imageType, imageUnscale);
    return Math.hypot(value[0], value[1]);
  } else {
    return getPixelScalarValue(pixel, imageType, imageUnscale);
  }
}

export function getPixelDirectionValue(pixel: number[], imageType: ImageType, imageUnscale: ImageUnscale): number {
  if (imageType === ImageType.VECTOR) {
    const value = getPixelVectorValue(pixel, imageType, imageUnscale);
    return ((360 - (Math.atan2(value[1], value[0]) / Math.PI * 180 + 180)) - 270) % 360;
  } else {
    return NaN;
  }
}