import {TextureDataArray} from '../../../client/_utils/texture-data.js';
import type {ImageInterpolation} from '../../../deck/_utils/image-interpolation.js';
import type {ImageType} from '../../../client/_utils/image-type.js';
import type {ImageUnscale} from '../../../client/_utils/image-unscale.js';

export class ContourLineWorker {
  getContourLineData(
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
    interval: number
  ): Float32Array;
}