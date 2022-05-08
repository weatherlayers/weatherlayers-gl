import {parsePalette} from 'cpt2js';
import {getValueData} from '../../../_utils/data';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/data').FloatData} FloatData */

/**
 * @param {FloatData} image
 * @param {ImageType} imageType
 * @param {Palette} palette
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function getRasterImage(image, imageType, palette) {
  const valueData = getValueData(image, imageType);
  const {data, width, height} = valueData;

  const paletteScale = parsePalette(palette);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
  const imageData = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;
      const j = (x + y * width) * 4;

      const value = data[i];
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