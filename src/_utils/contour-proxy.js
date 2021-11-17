/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {transfer, wrap} from 'comlink';
import contourWorker from 'worker!./contour-worker';

/** @typedef {GeoJSON.Feature<GeoJSON.LineString, { value: number }>} Contour */

const contourWorkerProxy = wrap(contourWorker());

/**
 * @param {Float32Array} contoursData
 * @returns {Contour[]}
 */
function getContoursFromData(contoursData) {
  let i = 0;

  const contours = /** @type {Contour[]} */([]);
  const contoursCount = contoursData[i++];
  for (let j = 0; j < contoursCount; j++) {
    const coordinates = /** @type {[number, number][]} */ ([]);
    const coordinatesCount = contoursData[i++];
    for (let k = 0; k < coordinatesCount; k++) {
      const position = /** @type {[number, number]} */ ([contoursData[i++], contoursData[i++]]);
      coordinates.push(position);
    }
    const value = contoursData[i++];
    contours.push({ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: { value }});
  }

  return contours;
}

/**
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} delta
 * @param {[number, number, number, number]} bounds
 * @returns {Promise<Contour[]>}
 */
export async function getContours(data, width, height, delta, bounds) {
  data = transfer(data, [data.buffer]);
  const contoursData = await contourWorkerProxy.getContoursData(data, width, height, delta, bounds);
  const contours = getContoursFromData(contoursData);
  return contours;
}