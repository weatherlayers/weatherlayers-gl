import {expose, transfer} from 'comlink';
import {getUnprojectFunction} from '../../../_utils/unproject';
import {blur} from '../../../_utils/blur';
import {distance} from '../../../_utils/geodesy';

/**
 * inspired by https://sourceforge.net/p/wxmap2/svn/473/tree//trunk/app/src/opengrads/extensions/mf/ftn_clhilo.F
 * @param {Float32Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @param {GeoJSON.BBox} bounds
 * @returns {Float32Array}
 */
function getHighLowPointData(data, width, height, radius, bounds) {
  const unproject = getUnprojectFunction(width, height, bounds);
  const radiusKm = radius * 1000;

  // blur noisy data
  data = blur(data, width, height);

  // find highs and lows
  /** @type {{ position: GeoJSON.Position, value: number }[]} */
  let highs = [];
  /** @type {{ position: GeoJSON.Position, value: number }[]} */
  let lows = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = x + y * width;

      const value = data[i];

      if (
        !isNaN(value) &&
        value >= data[(x + 1) + (y    ) * width] &&
        value >= data[(x + 1) + (y + 1) * width] &&
        value >= data[(x    ) + (y + 1) * width] &&
        value >= data[(x - 1) + (y + 1) * width] &&
        value >  data[(x - 1) + (y    ) * width] &&
        value >  data[(x - 1) + (y - 1) * width] &&
        value >  data[(x    ) + (y - 1) * width] &&
        value >  data[(x + 1) + (y - 1) * width]
      ) {
        const point = [x, y];
        const position = unproject(point);
        highs.push({ position, value });
      }

      if (
        !isNaN(value) &&
        value <= data[(x + 1) + (y    ) * width] &&
        value <= data[(x + 1) + (y + 1) * width] &&
        value <= data[(x    ) + (y + 1) * width] &&
        value <= data[(x - 1) + (y + 1) * width] &&
        value <  data[(x - 1) + (y    ) * width] &&
        value <  data[(x - 1) + (y - 1) * width] &&
        value <  data[(x    ) + (y - 1) * width] &&
        value <  data[(x + 1) + (y - 1) * width]
      ) {
        const point = [x, y];
        const position = unproject(point);
        lows.push({ position, value });
      }
    }
  }
  highs = highs.sort((a, b) => b.value - a.value);
  lows = lows.sort((a, b) => a.value - b.value);

  // remove proximate highs
  for (let i = 0; i < highs.length; i++) {
    const high = highs[i];
    if (high) {
      for (let j = i + 1; j < highs.length; j++) {
        const high2 = highs[j];
        if (high2 && distance(high.position, high2.position) < radiusKm) {
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
        if (low2 && distance(low.position, low2.position) < radiusKm) {
          lows[j] = undefined;
        }
      }
    }
  }
  lows = lows.filter(x => !!x);

  const highLowPointData = new Float32Array([
    highs.length,
    ...highs.map(x => [...x.position, x.value]).flat(),
    lows.length,
    ...lows.map(x => [...x.position, x.value]).flat(),
  ]);
  
  return highLowPointData;
}

expose({
  /**
   * @param {Float32Array} data
   * @param {number} width
   * @param {number} height
   * @param {number} radius
   * @param {GeoJSON.BBox} bounds
   * @returns {Float32Array}
   */
  getHighLowPointData(data, width, height, radius, bounds) {
    const highLowPointData = getHighLowPointData(data, width, height, radius, bounds);
    return transfer(highLowPointData, [highLowPointData.buffer]);
  },
});