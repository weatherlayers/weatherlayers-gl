// TODO: fix Rollup build config to use TS instead of JS
import {expose, transfer} from 'comlink';
import {getHighLowPointData} from './high-low-point-worker-inner.js';

/** @typedef {import('../../../_utils/data.js').TextureDataArray} TextureDataArray */
/** @typedef {import('../../../_utils/image-interpolation.js').ImageInterpolation} ImageInterpolation */
/** @typedef {import('../../../_utils/image-type.js').ImageType} ImageType */
/** @typedef {import('../../../_utils/image-unscale.js').ImageUnscale} ImageUnscale */

expose({
  /**
   * @param {TextureDataArray} data
   * @param {TextureDataArray | null} data2
   * @param {number} width
   * @param {number} height
   * @param {number} imageSmoothing
   * @param {ImageInterpolation} imageInterpolation
   * @param {number} imageWeight
   * @param {ImageType} imageType
   * @param {ImageUnscale} imageUnscale
   * @param {GeoJSON.BBox} bounds
   * @param {number} radius
   * @returns {Float32Array}
   */
  getHighLowPointData(data, data2, width, height, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, bounds, radius) {
    const highLowPointData = getHighLowPointData(data, data2, width, height, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, bounds, radius);
    return transfer(highLowPointData, [highLowPointData.buffer]);
  }
});