import {transfer, wrap} from 'comlink';
import highLowPointWorker from 'worker!./high-low-point-worker';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').TextureData} TextureData */
/** @typedef {'L' | 'H'} HighLowType */
/** @typedef {{ type: HighLowType, value: number }} HighLowPointProperties */

const highLowPointWorkerProxy = wrap(highLowPointWorker());

/**
 * @param {Float32Array} highLowPointData
 * @returns {GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[]}
 */
function getHighLowPointsFromData(highLowPointData) {
  let i = 0;

  const highLowPoints = /** @type {GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[]} */([]);
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
 * @param {TextureData} image
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @param {number} radius
 * @param {GeoJSON.BBox} bounds
 * @returns {Promise<GeoJSON.FeatureCollection<GeoJSON.Point, HighLowPointProperties>>}
 */
export async function getHighLowPoints(image, imageType, imageUnscale, radius, bounds) {
  const {data, width, height} = image;

  const dataCopy = data.slice(0);
  const highLowPointData = await highLowPointWorkerProxy.getHighLowPointData(transfer(dataCopy, [dataCopy.buffer]), width, height, imageType, imageUnscale, radius, bounds);
  const highLowPoints = getHighLowPointsFromData(highLowPointData);

  return { type: 'FeatureCollection', features: highLowPoints };
}