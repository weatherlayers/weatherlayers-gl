import {blur} from '../../_utils/blur.js';
import {distance} from '../../_utils/geodesy.js';
import type {FloatData} from '../../_utils/texture-data.js';
import type {ImageProperties} from '../../_utils/image-properties.js';
import {getRasterMagnitudeData} from '../../_utils/raster-data.js';
import {getUnprojectFunction} from '../../_utils/project.js';

/**
 * inspired by https://sourceforge.net/p/wxmap2/svn/473/tree//trunk/app/src/opengrads/extensions/mf/ftn_clhilo.F
 */
function getHighLowPointData(floatData: FloatData, bounds: GeoJSON.BBox, radius: number): Float32Array {
  let {data, width, height} = floatData;
  const radiusKm = radius * 1000;
  const unproject = getUnprojectFunction(width, height, bounds);

  // blur noisy data, TODO: replace by imageInterpolation on GPU
  data = blur(data, width, height);

  // find highs and lows
  let highs: {position: GeoJSON.Position, value: number}[] = [];
  let lows: {position: GeoJSON.Position, value: number}[] = [];
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
        highs.push({position, value});
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
        lows.push({position, value});
      }
    }
  }
  highs = highs.sort((a, b) => b.value - a.value);
  lows = lows.sort((a, b) => a.value - b.value);

  // remove proximate highs
  const filteredHighs: ({position: GeoJSON.Position, value: number} | undefined)[] = [...highs];
  for (let i = 0; i < filteredHighs.length; i++) {
    const high = filteredHighs[i];
    if (high) {
      for (let j = i + 1; j < filteredHighs.length; j++) {
        const high2 = filteredHighs[j];
        if (high2 && distance(high.position, high2.position) < radiusKm) {
          filteredHighs[j] = undefined;
        }
      }
    }
  }
  highs = filteredHighs.filter(x => !!x) as {position: GeoJSON.Position, value: number}[];

  // remove proximate lows
  const filteredLows: ({position: GeoJSON.Position, value: number} | undefined)[] = [...lows];
  for (let i = 0; i < filteredLows.length; i++) {
    const low = filteredLows[i];
    if (low) {
      for (let j = i + 1; j < filteredLows.length; j++) {
        const low2 = filteredLows[j];
        if (low2 && distance(low.position, low2.position) < radiusKm) {
          filteredLows[j] = undefined;
        }
      }
    }
  }
  lows = filteredLows.filter(x => !!x) as {position: GeoJSON.Position, value: number}[];

  const highLowPointData = new Float32Array([
    highs.length,
    ...highs.map(x => [...x.position, x.value]).flat(),
    lows.length,
    ...lows.map(x => [...x.position, x.value]).flat(),
  ]);
  
  return highLowPointData;
}

export function getHighLowPointDataMain(imageProperties: ImageProperties, bounds: GeoJSON.BBox, radius: number): Float32Array {
  const magnitudeData = getRasterMagnitudeData(imageProperties);
  const highLowPointData = getHighLowPointData(magnitudeData, bounds, radius);
  return highLowPointData;
}