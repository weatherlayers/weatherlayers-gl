import {transfer, wrap} from 'comlink';
import {getValueData} from '../../../_utils/data';
import highLowPointWorker from 'worker!./high-low-point-worker';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').FloatData} FloatData */
/** @typedef {'L' | 'H'} HighLowType */
/** @typedef {GeoJSON.Feature<GeoJSON.Point, { type: HighLowType, value: number }>} HighLowPoint */

const highLowPointWorkerProxy = wrap(highLowPointWorker());

/**
 * @param {Float32Array} highLowPointData
 * @returns {HighLowPoint[]}
 */
function getHighLowPointsFromData(highLowPointData) {
  let i = 0;

  const highLowPoints = /** @type {HighLowPoint[]} */([]);
  const highCount = highLowPointData[i++];
  for (let j = 0; j < highCount; j++) {
    const position = [highLowPointData[i++], highLowPointData[i++]];
    const value = highLowPointData[i++];
    highLowPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { type: 'H', value }});
  }
  const lowCount = highLowPointData[i++];
  for (let j = 0; j < lowCount; j++) {
    const position = [highLowPointData[i++], highLowPointData[i++]];
    const value = highLowPointData[i++];
    highLowPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { type: 'L', value }});
  }

  return highLowPoints;
}

/**
 * @param {FloatData} image
 * @param {ImageType} imageType
 * @param {number} radius
 * @param {GeoJSON.BBox} bounds
 * @returns {Promise<HighLowPoint[]>}
 */
export async function getHighLowPoints(image, imageType, radius, bounds) {
  const valueData = getValueData(image, imageType);
  const {data, width, height} = valueData;

  const highLowPointData = await highLowPointWorkerProxy.getHighLowPointData(transfer(data, [data.buffer]), width, height, radius, bounds);
  const highLowPoints = getHighLowPointsFromData(highLowPointData);
  return highLowPoints;
}