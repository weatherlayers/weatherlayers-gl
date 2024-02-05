import type { ImageProperties } from '../../../_utils/image-properties.js';
import { getRasterMagnitudeData } from '../../../_utils/raster-data.js';
import { parsePalette, type Palette } from '../../../_utils/palette.js';
import { paletteColorToGl } from '../../../_utils/color.js';

export function getRasterImage(imageProperties: ImageProperties, palette: Palette): HTMLCanvasElement {
  const { image } = imageProperties;
  const { width, height } = image;

  const magnitudeData = getRasterMagnitudeData(imageProperties);
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
        // how to differentiate nodata NaN vs. imageMinValue/imageMaxValue NaN?
        // const color = paletteColorToGl(paletteScale(null).rgba());
        const color = [0, 0, 0, 0];
        imageData.data[j] = color[0];
        imageData.data[j + 1] = color[1];
        imageData.data[j + 2] = color[2];
        imageData.data[j + 3] = color[3];
        continue;
      }

      const color = paletteColorToGl(paletteScale(value).rgba());
      imageData.data[j] = color[0];
      imageData.data[j + 1] = color[1];
      imageData.data[j + 2] = color[2];
      imageData.data[j + 3] = color[3];
    }
  }
  context.putImageData(imageData, 0, 0);

  return canvas;
}