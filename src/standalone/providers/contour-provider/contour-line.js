import {transfer, wrap} from 'comlink';
import {getValueData} from '../../../_utils/data';
import contourLineWorker from 'worker!./contour-line-worker';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').FloatData} FloatData */
/** @typedef {GeoJSON.Feature<GeoJSON.LineString, { value: number }>} ContourLine */

const contourLineWorkerProxy = wrap(contourLineWorker());

/**
 * @param {Float32Array} contourLineData
 * @returns {ContourLine[]}
 */
function getContourLinesFromData(contourLineData) {
  let i = 0;

  const contourLines = /** @type {ContourLine[]} */([]);
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
 * @param {FloatData} image
 * @param {ImageType} imageType
 * @param {number} step
 * @param {GeoJSON.BBox} bounds
 * @returns {Promise<ContourLine[]>}
 */
export async function getContourLines(image, imageType, step, bounds) {
  const valueData = getValueData(image, imageType);
  const {data, width, height} = valueData;
  
  const contourLineData = await contourLineWorkerProxy.getContourLineData(transfer(data, [data.buffer]), width, height, step, bounds);
  const contourLines = getContourLinesFromData(contourLineData);
  return contourLines;
}