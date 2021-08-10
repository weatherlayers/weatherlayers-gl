/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as GeoTIFF from 'geotiff';
import GL from '@luma.gl/constants';

const CACHE = new Map();

/**
 * @param {string} url
 * @returns {Promise<ImageBitmap | HTMLImageElement | { width: number, height: number, data: Float32Array | Uint8Array, format: number }>}
 */
export function loadData(url) {
  if (url.includes('.png')) {
    return loadPng(url);
  } else if (url.includes('.tif')) {
    return loadGeotiff(url);
  } else {
    throw new Error('Unsupported data format');
  }
}

/**
 * @param {string} url
 * @returns {Promise<ImageBitmap | HTMLImageElement | { width: number, height: number, data: Float32Array | Uint8Array, format: number }>}
 */
export function loadDataCached(url) {
  const dataOrDataPromise = CACHE.get(url);
  if (dataOrDataPromise) {
    return dataOrDataPromise;
  }
  
  const dataPromise = loadData(url);
  CACHE.set(url, dataPromise);
  dataPromise.then(data => {
    CACHE.set(url, data);
  });
  return dataPromise;
}

/**
 * @param {Float32Array | Uint8Array} data
 * @param {number} [nodata]
 * @returns {Float32Array | Uint8Array}
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
 * @param {string} url
 * @returns {Promise<ImageBitmap | HTMLImageElement>}
 */
async function loadPng(url) {
  const blob = await (await fetch(url)).blob();

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode();

  const texture = window.createImageBitmap ? await window.createImageBitmap(image) : image;
  return texture;
}

/**
 * @param {Float32Array | Uint8Array} data
 * @param {number} bandsCount
 * @returns {number}
 */
function getGeotiffTextureFormat(data, bandsCount) {
  if (data.constructor === Float32Array) {
    if (bandsCount === 2) {
      return GL.RG32F;
    } else if (bandsCount === 1) {
      return GL.R32F;
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data.constructor === Uint8Array) {
    if (bandsCount === 4) {
      return GL.RGBA;
    } else if (bandsCount === 2) {
      return GL.LUMINANCE_ALPHA;
    } else {
      throw new Error('Unsupported data format');
    }
  } else {
    throw new Error('Unsupported data format');
  }
}

/**
 * @param {string} url
 * @returns {Promise<{ width: number, height: number, data: Float32Array | Uint8Array, format: number }>}
 */
async function loadGeotiff(url) {
  const geotiff = await GeoTIFF.fromUrl(url, { allowFullFile: true });
  const geotiffImage = await geotiff.getImage(0);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const sourceData = await geotiffImage.readRasters({ interleave: true });
  const nodata = geotiffImage.getGDALNoData();
  const data = maskData(sourceData, nodata);

  const bandsCount = geotiffImage.getSamplesPerPixel();
  const format = getGeotiffTextureFormat(data, bandsCount);

  const texture = { width, height, data, format };
  return texture;
}