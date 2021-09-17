/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {transfer, wrap} from 'comlink';
import hiloWorker from 'worker!./hilo-worker';

/** @typedef {'L' | 'H'} HiloType */
/** @typedef {GeoJSON.Point & { properties: { type: HiloType, value: number }}} Hilo */

const hiloProxy = wrap(hiloWorker());

/**
 * @param {Float32Array} highsLowsData
 * @returns {Hilo[]}
 */
function getHighsLowsFromData(highsLowsData) {
  let i = 0;

  const highsLows = /** @type {Hilo[]} */([]);
  const highsCount = highsLowsData[i++];
  for (let j = 0; j < highsCount; j++) {
    const position = [highsLowsData[i++], highsLowsData[i++]];
    const value = highsLowsData[i++];
    highsLows.push({ type: 'Point', coordinates: position, properties: { type: 'H', value }});
  }
  const lowsCount = highsLowsData[i++];
  for (let j = 0; j < lowsCount; j++) {
    const position = [highsLowsData[i++], highsLowsData[i++]];
    const value = highsLowsData[i++];
    highsLows.push({ type: 'Point', coordinates: position, properties: { type: 'L', value }});
  }

  return highsLows;
}

/**
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @param {[number, number, number, number]} bounds
 * @returns {Promise<Hilo[]>}
 */
export async function getHighsLows(data, width, height, radius, bounds) {
  data = transfer(data, [data.buffer]);
  const highsLowsData = await hiloProxy.getHighsLowsData(data, width, height, radius, bounds);
  const highsLows = getHighsLowsFromData(highsLowsData);
  return highsLows;
}