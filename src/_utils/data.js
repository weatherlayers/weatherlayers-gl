import * as GeoTIFF from 'geotiff';
import GL from '@luma.gl/constants';
import {ImageType} from './image-type';

/** @typedef {import('./image-type').ImageType} ImageType */
/** @typedef {Uint8Array | Uint8ClampedArray | Float32Array} TextureDataArray */
/** @typedef {{ data: TextureDataArray, width: number, height: number }} TextureData */
/** @typedef {Float32Array} FloatDataArray */
/** @typedef {{ data: FloatDataArray, width: number, height: number }} FloatData */

/**
 * @param {TextureDataArray} data
 * @param {number} [nodata]
 * @returns {TextureDataArray}
 */
function maskData(data, nodata = undefined) {
  if (nodata == undefined) {
    return data;
  }

  // sea_ice_fraction:
  // - real nodata: 1.27999997138977
  // - meta nodata: 1.27999997138977095, parsed in JS as 1.279999971389771
  const maskedData = data.slice(0);
  for (let i = 0; i < maskedData.length; i++) {
    if (Math.abs(maskedData[i] - nodata) < Number.EPSILON * 2) {
      maskedData[i] = NaN;
    }
  }

  return maskedData;
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
async function loadImage(url) {
  const blob = await (await fetch(url)).blob();

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const textureData = { data, width, height };
  return textureData;
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
async function loadGeotiff(url) {
  // larger blockSize helps with errors, see https://github.com/geotiffjs/geotiff.js/issues/218
  const geotiff = await GeoTIFF.fromUrl(url, { allowFullFile: true, blockSize: 10*1024*1024 });
  const geotiffImage = await geotiff.getImage(0);

  const sourceData = await geotiffImage.readRasters({ interleave: true });
  const nodata = geotiffImage.getGDALNoData();
  const data = maskData(sourceData, nodata);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const textureData = { data, width, height };
  return textureData;
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
export function loadTextureData(url) {
  if (url.includes('.png')) {
    return loadImage(url);
  } else if (url.includes('.tif')) {
    return loadGeotiff(url);
  } else {
    throw new Error('Unsupported data format');
  }
}