import {parsePalette} from 'cpt2js';
import type {Palette} from 'cpt2js';
import type {TextureData} from '../../../_utils/data.js';
import {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import type {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';
import {getPixelSmoothInterpolate} from '../../../_utils/pixel.js';
import {hasPixelValue, getPixelMagnitudeValue} from '../../../_utils/pixel-value.js';

export function getRasterImage(image: TextureData, imageType: ImageType, imageUnscale: ImageUnscale, palette: Palette): HTMLCanvasElement {
  const {width, height} = image;

  const paletteScale = parsePalette(palette);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const imageData = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * 4;

      const uvX = x / width;
      const uvY = y / height;
      const pixel = getPixelSmoothInterpolate(image, null, 0, ImageInterpolation.NEAREST, 0, uvX, uvY);
      if (!hasPixelValue(pixel, imageUnscale)) {
        const color = paletteScale(null as unknown as number).rgba();
        imageData.data[i] = color[0];
        imageData.data[i + 1] = color[1];
        imageData.data[i + 2] = color[2];
        imageData.data[i + 3] = color[3] * 255;
        continue;
      }

      const value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
      const color = paletteScale(value).rgba();

      imageData.data[i] = color[0];
      imageData.data[i + 1] = color[1];
      imageData.data[i + 2] = color[2];
      imageData.data[i + 3] = color[3] * 255;
    }
  }
  context.putImageData(imageData, 0, 0);

  return canvas;
}