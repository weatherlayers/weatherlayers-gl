/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {ImageBitmap | HTMLImageElement} image
 * @returns {ImageData}
 */
export function loadImageData(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return imageData;
}

/**
 * unscale 8bit grayscale image back to original data
 * @param {ImageData} imageData
 * @param {[number, number]} imageBounds
 * @returns {{ data: Float32Array, width: number, height: number }}
 */
export function unscaleImageData(imageData, imageBounds) {
  const {data, width, height} = imageData;

  const unscaledData = new Float32Array(
    Array.from(data)
      .filter((_, i) => i % 4 === 0)
      .map(x => x / 255 * (imageBounds[1] - imageBounds[0]) + imageBounds[0])
  );

  return { data: unscaledData, width, height };
}

/**
 * @param {ImageBitmap | HTMLImageElement} image
  * @param {[number, number]} imageBounds
 * @returns {{ data: Float32Array, width: number, height: number }}
 */
export function loadUnscaleImageData(image, imageBounds) {
  const imageData = loadImageData(image);
  const unscaledImageData = unscaleImageData(imageData, imageBounds);
  return unscaledImageData;
}