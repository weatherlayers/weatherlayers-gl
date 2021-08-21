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
 * box blur, average of 3x3 pixels
 * see https://en.wikipedia.org/wiki/Box_blur
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @returns {Float32Array}
 */
function blur(data, width, height) {
  const result = new Float32Array(data.length);
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (i >= 1 && i <= width - 2 && j >= 1 && j <= height - 2) {
        const values = [
          data[(i - 1) + (j - 1) * width], data[(i    ) + (j - 1) * width], data[(i + 1) + (j - 1) * width],
          data[(i - 1) + (j    ) * width], data[(i    ) + (j    ) * width], data[(i + 1) + (j    ) * width],
          data[(i - 1) + (j + 1) * width], data[(i    ) + (j + 1) * width], data[(i + 1) + (j - 1) * width],
        ];
        result[i + j * width] = values.reduce((acc, curr) => acc + curr, 0) / values.length;
      } else {
        result[i + j * width] = data[i + j * width];
      }
    }
  }
  return result;
}

/**
 * @param {{ width: number, height: number, data: Float32Array }} imageData
 * @param {number} radius
 * @param {number} delta
 * @returns {HiloPoint[]}
 */
export function getHighsLows(imageData, radius, delta) {
  let { width, height, data } = imageData;
  const unproject = getUnprojectFunction(width, height);
  const radiusKm = radius * 1000;

  // blur noisy data
  // see screenshot at https://gis.stackexchange.com/questions/386050/algorithm-to-find-low-high-atmospheric-pressure-systems-in-gridded-raster-data
  data = blur(data, width, height);

  // find highs and lows
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

  // remove proximate highs
  highs = highs.sort((a, b) => b.value - a.value);
  lows = lows.sort((a, b) => a.value - b.value);
  for (let i = 0; i < highs.length; i++) {
    const high = highs[i];
    if (high) {
      for (let j = i + 1; j < highs.length; j++) {
        const high2 = highs[j];
        if (high2 && distance(high.position, high2.position) < radiusKm && Math.abs(high.value - high2.value) < delta) {
          highs[j] = undefined;
        }
      }
    }
  }
  highs = highs.filter(x => !!x);

  // remove proximate lows
  for (let i = 0; i < lows.length; i++) {
    const low = lows[i];
    if (low) {
      for (let j = i + 1; j < lows.length; j++) {
        const low2 = lows[j];
        if (low2 && distance(low.position, low2.position) < radiusKm && Math.abs(low.value - low2.value) < delta) {
          lows[j] = undefined;
        }
      }
    }
  }
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