import type {TextureData} from '../../client/_utils/texture-data.js';
import type {ImageInterpolation} from './image-interpolation.js';
import type {ImageType} from '../../client/_utils/image-type.js';
import type {ImageUnscale} from '../../client/_utils/image-unscale.js';

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