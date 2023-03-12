import type {TextureData} from '../../../_utils/data.js';
import type {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import type {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';
import {getProjectFunction} from '../../../_utils/project.js';
import {getPixelSmoothInterpolate} from '../../../_utils/pixel.js';
import {hasPixelValue, getPixelMagnitudeValue, getPixelDirectionValue} from '../../../_utils/pixel-value.js';

export interface GridPointProperties {
  value: number;
  direction: number;
}

export function getGridPoints(image: TextureData, image2: TextureData | null, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageWeight: number, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, positions: GeoJSON.Position[]): GeoJSON.FeatureCollection<GeoJSON.Point, GridPointProperties> {
  const {width, height} = image;
  const project = getProjectFunction(width, height, bounds);

  const gridPoints: GeoJSON.Feature<GeoJSON.Point, GridPointProperties>[] = [];
  for (let position of positions) {
    const point = project(position);

    const uvX = point[0] / width;
    const uvY = point[1] / height;
    const pixel = getPixelSmoothInterpolate(image, image2, imageSmoothing, imageInterpolation, imageWeight, uvX, uvY);
    if (!hasPixelValue(pixel, imageUnscale)) {
      continue;
    }

    const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
    const direction = getPixelDirectionValue(pixel, imageType, imageUnscale);

    gridPoints.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: { value, direction }});
  }

  return { type: 'FeatureCollection', features: gridPoints };
}