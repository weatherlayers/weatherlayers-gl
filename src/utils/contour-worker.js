/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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