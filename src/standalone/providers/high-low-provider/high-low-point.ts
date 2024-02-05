import { transfer, wrap } from 'comlink';
import createHighLowPointWorker from 'worker!./high-low-point-worker.js';
import { HighLowPointWorker } from './high-low-point-worker.js';
import type { ImageProperties } from '../../../_utils/image-properties.js';

export enum HighLowType {
  LOW = 'L',
  HIGH = 'H',
}

export interface HighLowPointProperties {
  type: HighLowType;
  value: number;
}

const highLowPointWorkerProxy = wrap<HighLowPointWorker>(createHighLowPointWorker());

function createHighLowPoint(position: GeoJSON.Position, properties: HighLowPointProperties): GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties };
}

function getHighLowPointsFromData(highLowPointData: Float32Array): GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[] {
  let i = 0;

  const highLowPoints: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[] = [];
  const highCount = highLowPointData[i++];
  for (let j = 0; j < highCount; j++) {
    const position = [highLowPointData[i++], highLowPointData[i++]];
    const value = highLowPointData[i++];
    highLowPoints.push(createHighLowPoint(position, { type: HighLowType.HIGH, value }));
  }
  const lowCount = highLowPointData[i++];
  for (let j = 0; j < lowCount; j++) {
    const position = [highLowPointData[i++], highLowPointData[i++]];
    const value = highLowPointData[i++];
    highLowPoints.push(createHighLowPoint(position, { type: HighLowType.LOW, value }));
  }

  return highLowPoints;
}

export async function getHighLowPoints(imageProperties: ImageProperties, bounds: GeoJSON.BBox, radius: number): Promise<GeoJSON.FeatureCollection<GeoJSON.Point, HighLowPointProperties>> {
  const { image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue } = imageProperties;
  const { data, width, height } = image;
  const { data: data2 = null, width: width2 = null, height: height2 = null } = image2 || {};

  const dataCopy = data.slice(0);
  const data2Copy = data2 ? data2.slice(0) : null;
  const highLowPointData = await highLowPointWorkerProxy.getHighLowPointData(transfer(dataCopy, [dataCopy.buffer]), width, height, data2Copy ? transfer(data2Copy, [data2Copy.buffer]) : null, width2, height2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, radius);
  const highLowPoints = getHighLowPointsFromData(highLowPointData);

  return { type: 'FeatureCollection', features: highLowPoints };
}