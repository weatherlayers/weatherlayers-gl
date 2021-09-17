/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {getHighsLowsData} from './hilo';
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