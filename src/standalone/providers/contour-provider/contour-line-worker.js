// TODO: fix Rollup build config to use TS instead of JS
import {expose, transfer} from 'comlink';
import {getContourLineData} from './contour-line-worker-inner';

/** @typedef {import('../../../_utils/data.js').TextureDataArray} TextureDataArray */
/** @typedef {import('../../../_utils/image-interpolation.js').ImageInterpolation} ImageInterpolation */
/** @typedef {import('../../../_utils/image-type.js').ImageType} ImageType */
/** @typedef {import('../../../_utils/image-unscale.js').ImageUnscale} ImageUnscale */

expose({
  /**
   * @param {TextureDataArray} data
   * @param {number} width
   * @param {number} height
   * @param {number} imageSmoothing
   * @param {ImageInterpolation} imageInterpolation
   * @param {ImageType} imageType
   * @param {ImageUnscale} imageUnscale
   * @param {GeoJSON.BBox} bounds
   * @param {number} interval
   * @returns {Float32Array}
   */
  getContourLineData(data, width, height, imageSmoothing, imageInterpolation, imageType, imageUnscale, bounds, interval) {
    const contourLineData = getContourLineData(data, width, height, imageSmoothing, imageInterpolation, imageType, imageUnscale, bounds, interval);
    return transfer(contourLineData, [contourLineData.buffer]);
  }
});