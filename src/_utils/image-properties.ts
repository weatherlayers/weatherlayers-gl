import type { TextureData } from './data.js';
import type { ImageInterpolation } from './image-interpolation.js';
import type { ImageType } from './image-type.js';
import type { ImageUnscale } from './image-unscale.js';

export interface ImageProperties {
  image: TextureData;
  image2: TextureData | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  imageMinValue: number | null;
  imageMaxValue: number | null;
}