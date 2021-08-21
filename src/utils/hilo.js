/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {getUnprojectFunction} from './unproject';
import {distance} from './geodesy';

/** @typedef {'L' | 'H'} HiloPointType */
/** @typedef {GeoJSON.Point & { properties: { type: HiloPointType, value: number }}} HiloPoint */

/**
 * @param {{ width: number, height: number, data: Float32Array }} imageData
 * @param {number} radius
 * @param {number} delta
 * @returns {HiloPoint[]}
 */
export function getHighsLows(imageData, radius, delta) {
  const { width, height, data } = imageData;
  const radiusKm = radius * 1000;
  const unproject = getUnprojectFunction(width, height);

  /** @type {{ position: GeoJSON.Position, value: number }[]} */
  let highs = [];
  /** @type {{ position: GeoJSON.Position, value: number }[]} */
  let lows = [];
  for (let i = 1; i < width - 1; i++) {
    for (let j = 1; j < height - 1; j++) {
      const value = data[i + j * width];
      if (
        value >= data[(i + 1) + (j    ) * width] &&
        value >= data[(i + 1) + (j + 1) * width] &&
        value >= data[(i    ) + (j + 1) * width] &&
        value >= data[(i - 1) + (j + 1) * width] &&
        value >  data[(i - 1) + (j    ) * width] &&
        value >  data[(i - 1) + (j - 1) * width] &&
        value >  data[(i    ) + (j - 1) * width] &&
        value >  data[(i + 1) + (j - 1) * width]
      ) {
        const point = [i, j];
        const position = unproject(point);
        highs.push({ position, value });
      }
      if (
        value <= data[(i + 1) + (j    ) * width] &&
        value <= data[(i + 1) + (j + 1) * width] &&
        value <= data[(i    ) + (j + 1) * width] &&
        value <= data[(i - 1) + (j + 1) * width] &&
        value <  data[(i - 1) + (j    ) * width] &&
        value <  data[(i - 1) + (j - 1) * width] &&
        value <  data[(i    ) + (j - 1) * width] &&
        value <  data[(i + 1) + (j - 1) * width]
      ) {
        const point = [i, j];
        const position = unproject(point);
        lows.push({ position, value });
      }
    }
  }

  // remove nearby points
  highs = highs.sort((a, b) => b.value - a.value);
  lows = lows.sort((a, b) => a.value - b.value);
  for (let i = 0; i < highs.length; i++) {
    const high = highs[i];
    if (high) {
      for (let j = i + 1; j < highs.length; j++) {
        const high2 = highs[j];
        if (high2 && distance(high.position, high2.position) < radiusKm && Math.abs(high.value - high2.value) < delta) {
          highs[i] = undefined;
          break;
        }
      }
    }
  }
  for (let i = 0; i < lows.length; i++) {
    const low = lows[i];
    if (low) {
      for (let j = i + 1; j < lows.length; j++) {
        const low2 = lows[j];
        if (low2 && distance(low.position, low2.position) < radiusKm && Math.abs(low.value - low2.value) < delta) {
          lows[i] = undefined;
          break;
        }
      }
    }
  }
  highs = highs.filter(x => !!x);
  lows = lows.filter(x => !!x);

  const highsLows = [
    ...highs.map(high => {
      return /** @type {HiloPoint} */ ({ type: 'Point', coordinates: high.position, properties: { type: 'H', value: high.value }});
    }),
    ...lows.map(low => {
      return /** @type {HiloPoint} */ ({ type: 'Point', coordinates: low.position, properties: { type: 'L', value: low.value }});
    }),
  ];
  
  return highsLows;
}