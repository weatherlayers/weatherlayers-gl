// TODO: fix Rollup build config to use TS instead of JS
import {expose, transfer} from 'comlink';
import {getHighLowPointDataMain} from './high-low-point-worker-main.js';

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
   * @param {number | null} width2
   * @param {number | null} height2
   * @param {number} imageSmoothing
   * @param {ImageInterpolation} imageInterpolation
   * @param {number} imageWeight
   * @param {ImageType} imageType
   * @param {ImageUnscale} imageUnscale
   * @param {number | null} imageMinValue
   * @param {number | null} imageMaxValue
   * @param {GeoJSON.BBox} bounds
   * @param {number} radius
   * @returns {Float32Array}
   */
  getHighLowPointData(data, width, height, data2, width2, height2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, radius) {
    const image = {data, width, height};
    const image2 = data2 ? {data: data2, width: width2, height: height2} : null;
    const imageProperties = {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue};
    const highLowPointData = getHighLowPointDataMain(imageProperties, bounds, radius);
    return transfer(highLowPointData, [highLowPointData.buffer]);
  }
});