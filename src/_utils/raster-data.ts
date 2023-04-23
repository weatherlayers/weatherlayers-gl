import type {TextureData} from './data.js';
import type {ImageInterpolation} from './image-interpolation.js';
import {ImageType} from './image-type.js';
import type {ImageUnscale} from './image-unscale.js';
import {getProjectFunction} from './project.js';
import {hasPixelValue, getPixelMagnitudeValue, getPixelDirectionValue} from './pixel-value.js';
import {getPixelInterpolate, getImageDownscaleResolution} from './pixel.js';
import type {FloatData} from './data.js';

export interface RasterPointProperties {
  value: number;
  direction?: number;
}

export function getRasterPoints(image: TextureData, image2: TextureData | null, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageWeight: number, imageType: ImageType, imageUnscale: ImageUnscale, bounds: GeoJSON.BBox, positions: GeoJSON.Position[]): GeoJSON.FeatureCollection<GeoJSON.Point, RasterPointProperties> {
  const {width, height} = image;
  const project = getProjectFunction(width, height, bounds);

  // smooth by downscaling resolution
  const imageDownscaleResolution = getImageDownscaleResolution(width, height, imageSmoothing);

  const rasterPoints = positions.map(position => {
    const point = project(position);

    const uvX = point[0] / width;
    const uvY = point[1] / height;
    const pixel = getPixelInterpolate(image, image2, imageDownscaleResolution, imageInterpolation, imageWeight, uvX, uvY);

    let rasterPointProperties;
    if (hasPixelValue(pixel, imageUnscale)) {
      const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
      if (imageType === ImageType.VECTOR) {
        const direction = getPixelDirectionValue(pixel, imageType, imageUnscale);
        rasterPointProperties = { value, direction };
      } else {
        rasterPointProperties = { value };
      }
    } else {
      rasterPointProperties = { value: NaN };
    }

    return { type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties: rasterPointProperties} as GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>;
  });

  return { type: 'FeatureCollection', features: rasterPoints };
}

export function getRasterMagnitudeData(image: TextureData, image2: TextureData | null, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageWeight: number, imageType: ImageType, imageUnscale: ImageUnscale): FloatData {
  const {width, height} = image;

  // smooth by downscaling resolution
  const imageDownscaleResolution = getImageDownscaleResolution(width, height, imageSmoothing);

  const magnitudeData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;

      const uvX = x / width;
      const uvY = y / height;
      const pixel = getPixelInterpolate(image, image2, imageDownscaleResolution, imageInterpolation, imageWeight, uvX, uvY);

      let value;
      if (hasPixelValue(pixel, imageUnscale)) {
        value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
      } else {
        value = NaN;
      }

      magnitudeData[i] = value;
    }
  }

  return { data: magnitudeData, width, height };
}