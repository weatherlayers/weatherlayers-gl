/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as GeoTIFF from 'geotiff';
import GL from '@luma.gl/constants';
import {ImageType} from './image-type';
import {linearColormap} from './colormap';

/** @typedef {import('./image-type').ImageType} ImageType */
/** @typedef {import('./colormap').ColormapBreaks} ColormapBreaks */
/** @typedef {Uint8Array | Uint8ClampedArray | Float32Array} TextureDataArray */
/** @typedef {{ data: TextureDataArray, width: number, height: number, bandsCount: number, format: number }} TextureData */
/** @typedef {Float32Array} FloatDataArray */
/** @typedef {{ data: FloatDataArray, width: number, height: number }} FloatData */

/**
 * @param {TextureDataArray} data
 * @param {number} [nodata]
 * @returns {TextureDataArray}
 */
function maskData(data, nodata = undefined) {
  if (!nodata) {
    return data;
  }

  // sea_ice_fraction:
  // - real nodata: 1.27999997138977
  // - meta nodata: 1.27999997138977095, parsed in JS as 1.279999971389771
  const maskedData = new data.constructor(Array.from(data).map(value => {
    return Math.abs(value - nodata) > Number.EPSILON * 2 ? value : NaN;
  }));

  return maskedData;
}

/**
 * @param {TextureDataArray} data
 * @param {number} bandsCount
 * @returns {number}
 */
function getDataTextureFormat(data, bandsCount) {
  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    if (bandsCount === 4) {
      return GL.RGBA;
    } else if (bandsCount === 2) {
      return GL.LUMINANCE_ALPHA;
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data instanceof Float32Array) {
    if (bandsCount === 2) {
      return GL.RG32F;
    } else if (bandsCount === 1) {
      return GL.R32F;
    } else {
      throw new Error('Unsupported data format');
    }
  } else {
    throw new Error('Unsupported data format');
  }
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

  const bandsCount = 4;
  const format = getDataTextureFormat(data, bandsCount);

  const textureData = { data, width, height, bandsCount, format };
  return textureData;
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
async function loadGeotiff(url) {
  const geotiff = await GeoTIFF.fromUrl(url, { allowFullFile: true });
  const geotiffImage = await geotiff.getImage(0);

  const sourceData = await geotiffImage.readRasters({ interleave: true });
  const nodata = geotiffImage.getGDALNoData();
  const data = maskData(sourceData, nodata);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const bandsCount = geotiffImage.getSamplesPerPixel();
  const format = getDataTextureFormat(data, bandsCount);

  const textureData = { data, width, height, bandsCount, format };
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

/**
 * @param {TextureData} textureData
 * @param {ImageType} imageType
 * @param {[number, number]} imageBounds
 * @returns {FloatData}
 */
export function unscaleTextureData(textureData, imageType, imageBounds) {
  const { data, width, height, bandsCount } = textureData;

  const imageScalarize = imageType === ImageType.VECTOR;
  const imageUnscale = !(data instanceof Float32Array);
  const delta = imageBounds[1] - imageBounds[0];

  const unscaledData = new Float32Array(width * height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * bandsCount;
      const j = y * width + x;

      // raster_has_values
      if (imageUnscale) {
        if (data[i + bandsCount - 1] !== 255) {
          unscaledData[j] = NaN;
          continue;
        }
      } else {
        if (isNaN(data[i])) {
          unscaledData[j] = NaN;
          continue;
        }
      }

      // raster_get_value
      let value;
      if (imageScalarize) {
        if (imageUnscale) {
          value = Math.hypot(
            imageBounds[0] + (data[i] / 255) * delta,
            imageBounds[0] + (data[i + 1] / 255) * delta
          )
        } else {
          value = Math.hypot(data[i], data[i + 1])
        }
      } else {
        if (imageUnscale) {
          value = imageBounds[0] + (data[i] / 255) * delta;
        } else {
          value = data[i];
        }
      }

      unscaledData[j] = value;
    }
  }

  return { data: unscaledData, width, height };
}

/**
 * @param {TextureData} textureData
 * @param {ImageType} imageType
 * @param {[number, number]} imageBounds
 * @param {ColormapBreaks} colormapBreaks
 * @returns {HTMLCanvasElement}
 */
export function colorTextureData(textureData, imageType, imageBounds, colormapBreaks) {
  const floatData = unscaleTextureData(textureData, imageType, imageBounds);
  const { data, width, height } = floatData;

  const colormap = linearColormap(colormapBreaks);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
  const imageData = context.createImageData(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const i = y * width + x;
      const j = (y * width + x) * 4;

      const value = data[i];
      const color = colormap(value);

      imageData.data[j] = color[0];
      imageData.data[j + 1] = color[1];
      imageData.data[j + 2] = color[2];
      imageData.data[j + 3] = color[3] * 255;
    }
  }
  context.putImageData(imageData, 0, 0);

  return canvas;
}