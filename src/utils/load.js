/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getMetadata } from 'meta-png';
import * as GeoTIFF from 'geotiff';
import GL from '@luma.gl/constants';

/**
 * DataView.getBigUint64 polyfill for Safari
 * used in meta-png
 * see https://github.com/GoogleChromeLabs/jsbi/issues/4#issuecomment-851780893
 * @this {DataView}
 * @param {number} byteOffset
 * @param {boolean} [littleEndian]
 * @returns {BigInt}
 */
DataView.prototype.getBigUint64 ??= function(byteOffset, littleEndian) {
  const [h, l] = littleEndian ? [4, 0] : [0, 4];
  const wh = BigInt(this.getUint32(byteOffset + h, littleEndian));
  const wl = BigInt(this.getUint32(byteOffset + l, littleEndian));
  return (wh << 32n) + wl;
};

/**
 * @param {string | undefined} metadataString
 * @param {Float32Array | Uint8Array} [data]
 * @returns {[number, number] | undefined}
 */
 function parseImageBoundsFromMetadata(metadataString, data) {
  if (!metadataString) {
    if (!data) {
      return undefined;
    }

    // TODO: store min/max to float GeoTIFF?
    let min = Infinity;
    let max = -Infinity;
    Array.from(data).forEach(value => {
      if (typeof value === 'number') {
        min = Math.min(value, min);
        max = Math.max(value, max);
      }
    });
    const imageBounds = /** @type {[number, number]} */ ([min, max]);
    return imageBounds;
  }

  // GeoTIFF GDAL metadata are stored in XML, and encoded with HTML entities
  metadataString = metadataString.replaceAll('&amp;', '&');
  metadataString = metadataString.replaceAll('&quot;', '"');

  const metadata = JSON.parse(metadataString);
  if (typeof metadata.src_min !== 'number' || typeof metadata.src_max !== 'number') {
    throw new Error('Invalid metadata');
  }

  const imageBounds = /** @type {[number, number]} */ ([metadata.src_min, metadata.src_max]);
  return imageBounds;
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
 * @returns {Promise<{ texture: ImageBitmap | HTMLImageElement, imageBounds: [number, number] | undefined }>}
 */
async function loadPng(url) {
  const blob = await (await fetch(url)).blob();

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode();
  const texture = window.createImageBitmap ? await window.createImageBitmap(image) : image;

  const imageData = new Uint8Array(await blob.arrayBuffer());
  const metadataString = getMetadata(imageData, 'METADATA');
  const imageBounds = parseImageBoundsFromMetadata(metadataString);

  return { texture, imageBounds };
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
 * @returns {Promise<{ texture: { width: number, height: number, data: Float32Array | Uint8Array, format: number }, imageBounds: [number, number] | undefined }>}
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
  const metadataString = geotiffImage.getGDALMetadata()?.['METADATA'];
  const imageBounds = parseImageBoundsFromMetadata(metadataString, data);

  return { texture, imageBounds };
}

/**
 * @param {string} url
 * @returns {Promise<{ texture: ImageBitmap | HTMLImageElement | { width: number, height: number, data: Float32Array | Uint8Array, format: number }, imageBounds: [number, number] | undefined }>}
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
