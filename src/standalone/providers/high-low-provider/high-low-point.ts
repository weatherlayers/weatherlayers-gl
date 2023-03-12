import {transfer, wrap} from 'comlink';
import createHighLowPointWorker from 'worker!./high-low-point-worker.js';
import {HighLowPointWorker} from './high-low-point-worker.js';
import type {TextureData} from '../../../_utils/data.js';
import type {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';

export enum HighLowType {
  LOW = 'L',
  HIGH = 'H',
}

export interface HighLowPointProperties {
  type: HighLowType;
  value: number;
}

const highLowPointWorkerProxy = wrap<HighLowPointWorker>(createHighLowPointWorker());

function getHighLowPointsFromData(highLowPointData: Float32Array): GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[] {
  let i = 0;

  const highLowPoints: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[] = [];
  const highCount = highLowPointData[i++];
  for (let j = 0; j < highCount; j++) {
    const position = [highLowPointData[i++], highLowPointData[i++]];
    const value = highLowPointData[i++];
    highLowPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { type: HighLowType.HIGH, value }});
  }
  const lowCount = highLowPointData[i++];
  for (let j = 0; j < lowCount; j++) {
    const position = [highLowPointData[i++], highLowPointData[i++]];
    const value = highLowPointData[i++];
    highLowPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { type: HighLowType.LOW, value }});
  }

  return highLowPoints;
}

export async function getHighLowPoints(image: TextureData, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, radius: number): Promise<GeoJSON.FeatureCollection<GeoJSON.Point, HighLowPointProperties>> {
  const {data, width, height} = image;

  const dataCopy = data.slice(0);
  const highLowPointData = await highLowPointWorkerProxy.getHighLowPointData(transfer(dataCopy, [dataCopy.buffer]), width, height, imageType, imageUnscale, bounds, radius);
  const highLowPoints = getHighLowPointsFromData(highLowPointData);

  return { type: 'FeatureCollection', features: highLowPoints };
}