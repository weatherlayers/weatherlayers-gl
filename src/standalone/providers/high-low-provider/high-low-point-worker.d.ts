import { TextureDataArray } from '../../../_utils/data.js';
import type { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import type { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';

export class HighLowPointWorker {
  getHighLowPointData(
    data: TextureDataArray,
    width: number,
    height: number,
    data2: TextureDataArray | null,
    width2: number | null,
    height2: number | null,
    imageSmoothing: number,
    imageInterpolation: ImageInterpolation,
    imageWeight: number,
    imageType: ImageType,
    imageUnscale: ImageUnscale,
    imageMinValue: number | null,
    imageMaxValue: number | null,
    bounds: GeoJSON.BBox,
    radius: number
  ): Float32Array;
}