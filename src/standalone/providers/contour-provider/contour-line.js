import {transfer, wrap} from 'comlink';
import contourLineWorker from 'worker!./contour-line-worker';

/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').TextureData} TextureData */
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
 * @param {TextureData} image
 * @param {ImageType} imageType
 * @param {[number, number] | null} imageUnscale
 * @param {number} interval
 * @param {GeoJSON.BBox} bounds
 * @returns {Promise<ContourLine[]>}
 */
export async function getContourLines(image, imageType, imageUnscale, interval, bounds) {
  const {data, width, height} = image;
  
  const dataCopy = data.slice(0);
  const contourLineData = await contourLineWorkerProxy.getContourLineData(transfer(dataCopy, [dataCopy.buffer]), width, height, imageType, imageUnscale, interval, bounds);
  const contourLines = getContourLinesFromData(contourLineData);
  return contourLines;
}