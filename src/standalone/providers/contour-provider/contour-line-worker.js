// TODO: fix Rollup build config to use TS instead of JS
import {expose, transfer} from 'comlink';
import {getContourLineData} from './contour-line-worker-inner';

/** @typedef {import('../../../_utils/data.js').TextureDataArray} TextureDataArray */
/** @typedef {import('../../../_utils/image-type.js').ImageType} ImageType */
/** @typedef {import('../../../_utils/image-unscale.js').ImageUnscale} ImageUnscale */

expose({
  /**
   * @param {TextureDataArray} data
   * @param {number} width
   * @param {number} height
   * @param {ImageType} imageType
   * @param {ImageUnscale | null} imageUnscale
   * @param {GeoJSON.BBox} bounds
   * @param {number} interval
   * @returns {Float32Array}
   */
  getContourLineData(data, width, height, imageType, imageUnscale, bounds, interval) {
    const contourLineData = getContourLineData(data, width, height, imageType, imageUnscale, bounds, interval);
    return transfer(contourLineData, [contourLineData.buffer]);
  }
});