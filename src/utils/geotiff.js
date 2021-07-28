/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import GL from '@luma.gl/constants';
import * as GeoTIFF from 'geotiff';

/**
 * @param {Float32Array} data
 * @param {number} [nodata]
 * @returns {Float32Array}
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
 * @returns {Promise<{ width: number, height: number, format: number, data: Float32Array }>}
 */
export async function loadGeotiff(url) {
  const geotiff = await GeoTIFF.fromUrl(url);
  const geotiffImage = await geotiff.getImage(0);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const bands = geotiffImage.getSamplesPerPixel();
  const format = bands === 1 ? GL.R32F : bands === 2 ? GL.RG32F : undefined;
  if (!format) {
    throw new Error('Unsupported GeoTIFF image');
  }

  const data = await geotiffImage.readRasters({ interleave: true });
  const nodata = geotiffImage.getGDALNoData();
  const maskedData = maskData(data, nodata);

  return {
    width,
    height,
    format,
    data: maskedData
  };
}