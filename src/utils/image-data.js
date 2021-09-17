/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {HTMLImageElement} image
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
 * @param {Uint8Array | Uint8ClampedArray} data
 * @param {[number, number]} imageBounds
 * @param {number} bandsCount
 * @returns {Float32Array}
 */
export function unscaleImageData(data, imageBounds, bandsCount) {
  const unscaledData = new Float32Array(
    Array.from(data)
      .filter((_, i) => i % bandsCount === 0)
      .map(x => x / 255 * (imageBounds[1] - imageBounds[0]) + imageBounds[0])
  );
  return unscaledData;
}