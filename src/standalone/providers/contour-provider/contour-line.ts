import { transfer, wrap } from 'comlink';
import createContourLineWorker from 'worker!./contour-line-worker.js';
import type { ContourLineWorker } from './contour-line-worker.js';
import type { ImageProperties } from '../../../deck/_utils/image-properties.js';

export interface ContourLineProperties {
  value: number;
}

const contourLineWorkerProxy = wrap<ContourLineWorker>(createContourLineWorker());

function createContourLine(coordinates: GeoJSON.Position[], properties: ContourLineProperties): GeoJSON.Feature<GeoJSON.LineString, ContourLineProperties> {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates }, properties };
}

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
    contourLines.push(createContourLine(coordinates, { value }));
  }

  return contourLines;
}

export async function getContourLines(imageProperties: ImageProperties, bounds: GeoJSON.BBox, interval: number): Promise<GeoJSON.FeatureCollection<GeoJSON.LineString, ContourLineProperties>> {
  const { image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue } = imageProperties;
  const { data, width, height } = image;
  const { data: data2 = null, width: width2 = null, height: height2 = null } = image2 || {};

  const dataCopy = data.slice(0);
  const data2Copy = data2 ? data2.slice(0) : null;
  const contourLineData = await contourLineWorkerProxy.getContourLineData(transfer(dataCopy, [dataCopy.buffer]), width, height, data2Copy ? transfer(data2Copy, [data2Copy.buffer]) : null, width2, height2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, interval);
  const contourLines = getContourLinesFromData(contourLineData);

  return { type: 'FeatureCollection', features: contourLines };
}