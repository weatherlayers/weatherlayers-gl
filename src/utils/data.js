/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as GeoTIFF from 'geotiff';
import GL from '@luma.gl/constants';

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
 * @returns {Promise<{ data: HTMLImageElement }>}
 */
async function loadImage(url) {
  const blob = await (await fetch(url)).blob();

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode();

  return { data: image };
}

/**
 * @param {Float32Array | Uint8Array} data
 * @param {number} bandsCount
 * @returns {number}
 */
function getGeotiffTextureFormat(data, bandsCount) {
  if (data instanceof Float32Array) {
    if (bandsCount === 2) {
      return GL.RG32F;
    } else if (bandsCount === 1) {
      return GL.R32F;
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data instanceof Uint8Array) {
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
 * @returns {Promise<{ data: Float32Array | Uint8Array, width: number, height: number, format: number }>}
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

/**
 * @param {string} url
 * @returns {Promise<{ data: HTMLImageElement } | { data: Float32Array | Uint8Array, width: number, height: number, format: number }>}
 */
export function loadData(url) {
  if (url.includes('.png')) {
    return loadImage(url);
  } else if (url.includes('.tif')) {
    return loadGeotiff(url);
  } else {
    throw new Error('Unsupported data format');
  }
}