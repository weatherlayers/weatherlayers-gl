import {transfer, wrap} from 'comlink';
import createContourLineWorker from 'worker!./contour-line-worker.js';
import {ContourLineWorker} from './contour-line-worker.js';
import type {TextureData} from '../../../_utils/data.js';
import type {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';

export interface ContourLineProperties {
  value: number;
}

const contourLineWorkerProxy = wrap<ContourLineWorker>(createContourLineWorker());

function getContourLinesFromData(contourLineData: Float32Array): GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties>[] {
  let i = 0;

  const contourLines: GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties>[] = [];
  const contourCount = contourLineData[i++];
  for (let j = 0; j < contourCount; j++) {
    const coordinates: GeoJSON.Position[] = [];
    const coordinatesCount = contourLineData[i++];
    for (let k = 0; k < coordinatesCount; k++) {
      const position = [contourLineData[i++], contourLineData[i++]];
      coordinates.push(position);
    }
    const value = contourLineData[i++];
    contourLines.push({ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: { value }});
  }

  return contourLines;
}

export async function getContourLines(image: TextureData, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, interval: number): Promise<GeoJSON.FeatureCollection<GeoJSON.LineString, ContourLineProperties>> {
  const {data, width, height} = image;
  
  const dataCopy = data.slice(0);
  const contourLineData = await contourLineWorkerProxy.getContourLineData(transfer(dataCopy, [dataCopy.buffer]), width, height, imageType, imageUnscale, bounds, interval);
  const contourLines = getContourLinesFromData(contourLineData);

  return { type: 'FeatureCollection', features: contourLines };
}