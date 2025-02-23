// TODO: fix Rollup build config to use TS instead of JS
import {expose, transfer} from 'comlink';
import {getContourLineDataMain} from './contour-line-worker-main.js';

/** @typedef {import('../../../deck/_utils/texture-data.js').TextureDataArray} TextureDataArray */
/** @typedef {import('../../../deck/_utils/image-interpolation.js').ImageInterpolation} ImageInterpolation */
/** @typedef {import('../../../deck/_utils/image-type.js').ImageType} ImageType */
/** @typedef {import('../../../deck/_utils/image-unscale.js').ImageUnscale} ImageUnscale */

expose({
  /**
   * @param {TextureDataArray} data
   * @param {number} width
   * @param {number} height
   * @param {TextureDataArray | null} data2
   * @param {number | null} width
   * @param {number | null} height
   * @param {number} imageSmoothing
   * @param {ImageInterpolation} imageInterpolation
   * @param {number} imageWeight
   * @param {ImageType} imageType
   * @param {ImageUnscale} imageUnscale
   * @param {number | null} imageMinValue
   * @param {number | null} imageMaxValue
   * @param {GeoJSON.BBox} bounds
   * @param {number} interval
   * @returns {Float32Array}
   */
  getContourLineData(data, width, height, data2, width2, height2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, interval) {
    const image = {data, width, height};
    const image2 = data2 ? {data: data2, width: width2, height: height2} : null;
    const imageProperties = {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue};
    const contourLineData = getContourLineDataMain(imageProperties, bounds, interval);
    return transfer(contourLineData, [contourLineData.buffer]);
  }
});