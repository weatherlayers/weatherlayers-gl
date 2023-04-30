import { TextureDataArray } from '../../../_utils/data.js';
import type { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import type { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';

export class HighLowPointWorker {
  getHighLowPointData(data: TextureDataArray, data2: TextureDataArray | null, width: number, height: number, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageWeight: number, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, radius: number): Float32Array;
}