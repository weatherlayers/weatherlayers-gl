import {getHighsLowsData} from './high-low';
import {expose, transfer} from 'comlink';

expose({
  /**
   * @param {Float32Array} data
   * @param {number} width
   * @param {number} height
   * @param {number} radius
   * @param {[number, number, number, number]} bounds
   * @returns {Float32Array}
   */
  getHighsLowsData(data, width, height, radius, bounds) {
    const highsLowsData = getHighsLowsData(data, width, height, radius, bounds);
    return transfer(highsLowsData, [highsLowsData.buffer]);
  },
});