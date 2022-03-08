import {getContoursData} from './contour';
import {expose, transfer} from 'comlink';

expose({
  /**
   * @param {Float32Array} data
   * @param {number} width
   * @param {number} height
   * @param {number} delta
   * @param {[number, number, number, number]} bounds
   * @returns {Float32Array}
   */
  getContoursData(data, width, height, delta, bounds) {
    const contoursData = getContoursData(data, width, height, delta, bounds);
    return transfer(contoursData, [contoursData.buffer]);
  },
});