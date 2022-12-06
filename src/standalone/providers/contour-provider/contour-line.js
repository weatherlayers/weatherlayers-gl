import {transfer, wrap} from 'comlink';
import contourLineWorker from 'worker!./contour-line-worker.js';
import {ImageType} from '../../../_utils/image-type.js';

/** @typedef {import('../../../_utils/data').TextureData} TextureData */
/** @typedef {{ value: number }} ContourLineProperties */

const contourLineWorkerProxy = wrap(contourLineWorker());

/**
 * @param {Float32Array} contourLineData
 * @returns {GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties>[]}
 */
function getContourLinesFromData(contourLineData) {
  let i = 0;

  const contourLines = /** @type {GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties>[]} */([]);
  const contourCount = contourLineData[i++];
  for (let j = 0; j < contourCount; j++) {
    const coordinates = /** @type {[number, number][]} */ ([]);
    const coordinatesCount = contourLineData[i++];
    for (let k = 0; k < coordinatesCount; k++) {
      const position = /** @type {[number, number]} */ ([contourLineData[i++], contourLineData[i++]]);
      coordinates.push(position);
    }
    const value = contourLineData[i++];
    contourLines.push({ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: { value }});
  }

  return contourLines;
}

/**
 * @param {TextureData} image
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @param {GeoJSON.BBox} bounds
 * @param {number} interval
 * @returns {Promise<GeoJSON.FeatureCollection<GeoJSON.LineString, ContourLineProperties>>}
 */
export async function getContourLines(image, imageType, imageUnscale, bounds, interval) {
  const {data, width, height} = image;
  
  const dataCopy = data.slice(0);
  const contourLineData = await contourLineWorkerProxy.getContourLineData(transfer(dataCopy, [dataCopy.buffer]), width, height, imageType, imageUnscale, bounds, interval);
  const contourLines = getContourLinesFromData(contourLineData);

  return { type: 'FeatureCollection', features: contourLines };
}