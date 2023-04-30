import { parsePalette } from 'cpt2js';
import type { Palette } from 'cpt2js';
import type { TextureData } from '../../../_utils/data.js';
import { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import type { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';
import { getRasterMagnitudeData } from '../../../_utils/raster-data.js';

export function getRasterImage(image: TextureData, imageSmoothing: number, imageInterpolation: ImageInterpolation, imageType: ImageType, imageUnscale: ImageUnscale, palette: Palette): HTMLCanvasElement {
  const { width, height } = image;

  const magnitudeData = getRasterMagnitudeData(image, null, imageSmoothing, imageInterpolation, 0, imageType, imageUnscale);
  const paletteScale = parsePalette(palette);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const imageData = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;
      const j = (x + y * width) * 4;

      const value = magnitudeData.data[i];
      if (isNaN(value)) {
        const color = paletteScale(null as unknown as number).rgba();
        imageData.data[j] = color[0];
        imageData.data[j + 1] = color[1];
        imageData.data[j + 2] = color[2];
        imageData.data[j + 3] = color[3] * 255;
        continue;
      }

      const color = paletteScale(value).rgba();

      imageData.data[j] = color[0];
      imageData.data[j + 1] = color[1];
      imageData.data[j + 2] = color[2];
      imageData.data[j + 3] = color[3] * 255;
    }
  }
  context.putImageData(imageData, 0, 0);

  return canvas;
}