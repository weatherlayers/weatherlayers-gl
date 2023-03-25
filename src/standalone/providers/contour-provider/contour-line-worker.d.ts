import {TextureDataArray} from '../../../_utils/data.js';
import type {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import type {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';

export class ContourLineWorker {
  getContourLineData(data: TextureDataArray, width: number, height: number, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, interval: number): Float32Array;
}