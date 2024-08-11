import type { ImageProperties } from './image-properties.js';
import { ImageInterpolation } from './image-interpolation.js';
import { ImageType } from '../../client/_utils/image-type.js';
import { getProjectFunction } from './project.js';
import { hasPixelValue, getPixelMagnitudeValue, getPixelDirectionValue } from './pixel-value.js';
import { getPixelInterpolate, getImageDownscaleResolution } from './pixel.js';
import type { FloatData } from '../../client/_utils/texture-data.js';

export interface RasterPointProperties {
  value: number;
  direction?: number;
}

function isPositionInBounds(position: GeoJSON.Position, bounds: GeoJSON.BBox): boolean {
  return (
    (position[0] >= bounds[0] && position[0] <= bounds[2]) &&
    (position[1] >= bounds[1] && position[1] <= bounds[3])
  );
}

function createRasterPoint(position: GeoJSON.Position, properties: RasterPointProperties): GeoJSON.Feature<GeoJSON.Point, RasterPointProperties> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties };
}

export function getRasterPoints(imageProperties: ImageProperties, bounds: GeoJSON.BBox, positions: GeoJSON.Position[]): GeoJSON.FeatureCollection<GeoJSON.Point, RasterPointProperties> {
  const { image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue } = imageProperties;
  const { width, height } = image;
  const project = getProjectFunction(width, height, bounds);

  // smooth by downscaling resolution
  const imageDownscaleResolution = getImageDownscaleResolution(width, height, imageSmoothing);

  const rasterPoints = positions.map(position => {
    if (!isPositionInBounds(position, bounds)) {
      // drop position out of bounds
      return createRasterPoint(position, { value: NaN });
    }

    const point = project(position);

    const uvX = point[0] / width;
    const uvY = point[1] / height;
    const pixel = getPixelInterpolate(image, image2, imageDownscaleResolution, imageInterpolation, imageWeight, uvX, uvY);

    if (!hasPixelValue(pixel, imageUnscale)) {
      // drop nodata
      return createRasterPoint(position, { value: NaN });
    }

    const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
    if (
      (typeof imageMinValue === 'number' && !isNaN(imageMinValue) && value < imageMinValue) ||
      (typeof imageMaxValue === 'number' && !isNaN(imageMaxValue) && value > imageMaxValue)
    ) {
      // drop value out of bounds
      return createRasterPoint(position, { value: NaN });
    }

    if (imageType === ImageType.VECTOR) {
      const direction = getPixelDirectionValue(pixel, imageType, imageUnscale);
      return createRasterPoint(position, { value, direction });
    } else {
      return createRasterPoint(position, { value });
    }
  });

  return { type: 'FeatureCollection', features: rasterPoints };
}

export function getRasterMagnitudeData(imageProperties: ImageProperties): FloatData {
  const { image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue } = imageProperties;
  const { width, height } = image;

  // interpolation for entire data is slow, fallback to NEAREST interpolation + blur in worker
  // CPU speed (image 1440x721):
  // - NEAREST - 100 ms
  // - LINEAR - 600 ms
  // - CUBIC - 6 s
  // TODO: move getRasterMagnitudeData to GPU
  const effectiveImageInterpolation = imageInterpolation !== ImageInterpolation.NEAREST ? ImageInterpolation.NEAREST : imageInterpolation;

  // smooth by downscaling resolution
  const imageDownscaleResolution = getImageDownscaleResolution(width, height, imageSmoothing);

  const magnitudeData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;

      const uvX = x / width;
      const uvY = y / height;
      const pixel = getPixelInterpolate(image, image2, imageDownscaleResolution, effectiveImageInterpolation, imageWeight, uvX, uvY);

      if (!hasPixelValue(pixel, imageUnscale)) {
        // drop nodata
        magnitudeData[i] = NaN;
        continue;
      }

      const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
      if (
        (typeof imageMinValue === 'number' && !isNaN(imageMinValue) && value < imageMinValue) ||
        (typeof imageMaxValue === 'number' && !isNaN(imageMaxValue) && value > imageMaxValue)
      ) {
        // drop value out of bounds
        magnitudeData[i] = NaN;
        continue;
      }

      magnitudeData[i] = value;
    }
  }

  return { data: magnitudeData, width, height };
}