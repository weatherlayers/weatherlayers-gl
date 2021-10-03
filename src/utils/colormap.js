/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import rgba from 'color-rgba';

/** @typedef {string | [number, number, number] | [number, number, number, number]} ColorLiteral */
/** @typedef {[number, number, number, number]} ColorValue */
/** @typedef {[number, ColorLiteral][]} ColormapBreaks */

/**
 * @param {ColorLiteral} value
 * @return {ColorValue}
 */
function normalizeColor(value) {
  // extract alpha
  let valueWithoutAlpha;
  let colorAlpha;
  if (typeof value === 'string') {
    valueWithoutAlpha = value.substr(0, 7);
    const valueAlpha = value.substr(7, 2);
    if (valueAlpha !== '') {
      colorAlpha = parseInt(valueAlpha, 16) / 255;
    }
  } else if (Array.isArray(value)) {
    valueWithoutAlpha = /** @type {[number, number, number]} */ ([value[0], value[1], value[2]]);
    const valueAlpha = value[3];
    if (typeof valueAlpha !== 'undefined') {
      colorAlpha = valueAlpha / 255;
    }
  } else {
    throw new Error('Invalid state');
  }

  let color = rgba(valueWithoutAlpha);
  if (!color) {
    throw new Error('Invalid color');
  }
  if (typeof colorAlpha !== 'undefined') {
    color[3] = colorAlpha;
  }
  return color;
}

/**
 * @param {ColorLiteral} start
 * @param {ColorLiteral} end
 * @return {(ratio: number) => ColorValue}
 */
function colorInterpolator(start, end) {
  const startColor = normalizeColor(start);
  const endColor = normalizeColor(end);
  const deltaColor = [
    endColor[0] - startColor[0],
    endColor[1] - startColor[1],
    endColor[2] - startColor[2],
    endColor[3] - startColor[3],
  ];

  return ratio => {
    if (ratio <= 0) {
      return startColor;
    } else if (ratio >= 1) {
      return endColor;
    } else {
      return /** @type {ColorValue} */ ([
        Math.floor(startColor[0] + ratio * deltaColor[0]),
        Math.floor(startColor[1] + ratio * deltaColor[1]),
        Math.floor(startColor[2] + ratio * deltaColor[2]),
        startColor[3] + ratio * deltaColor[3],
      ]);
    }
  };
}

/**
 * @param {ColormapBreaks} colormapBreaks
 * @return {(value: number) => ColorValue}
 */
export function linearColormap(colormapBreaks) {
  const interpolators = new Array(colormapBreaks.length - 1).fill(undefined).map((_, i) => {
    return colorInterpolator(colormapBreaks[i][1], colormapBreaks[i + 1][1]);
  });

  return value => {
    const i = [-Infinity, ...colormapBreaks.map(x => x[0]), Infinity].findIndex(x => x > value);

    if (i <= 0) {
      return interpolators[0](0);
    } else if (i >= colormapBreaks.length + 1) {
      return interpolators[interpolators.length - 1](1);
    } else {
      const delta = colormapBreaks[i - 1][0] - colormapBreaks[i - 2][0];
      const ratio = delta > 0 ? (value - colormapBreaks[i - 2][0]) / delta : 0;
      return interpolators[i - 2](ratio);
    }
  };
}

/**
 * @param {(i: number) => ColorValue} colormapFunction
 * @param {[number, number]} colormapBounds
 * @param {{ count?: number }} options
 * @return {ColorValue[]}
 */
function colorRamp(colormapFunction, colormapBounds, { count = 256 } = {}) {
  const delta = colormapBounds[1] - colormapBounds[0];

  const colors = new Array(count).fill(undefined).map((_, i) => {
    const ratio = i / (count - 1);
    return colormapFunction(colormapBounds[0] + ratio * delta);
  });

  return colors;
}

/**
 * @param {(i: number) => ColorValue} colormapFunction
 * @param {[number, number]} colormapBounds
 * @param {{ count?: number }} options
 * @return {HTMLCanvasElement}
 */
export function colorRampCanvas(colormapFunction, colormapBounds, { count = 256 } = {}) {
  const colors = colorRamp(colormapFunction, colormapBounds, { count });

  const canvas = document.createElement('canvas');
  canvas.width = colors.length;
  canvas.height = 1;
  canvas.style.imageRendering = '-moz-crisp-edges';
  canvas.style.imageRendering = 'pixelated';
  
  const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    ctx.fillRect(i, 0, 1, canvas.height);
  }

  return canvas;
}

/**
 * @param {(i: number) => ColorValue} colormapFunction
 * @param {[number, number]} colormapBounds
 * @param {{ count?: number }} options
 * @return {string}
 */
export function colorRampUrl(colormapFunction, colormapBounds, { count = 256 } = {}) {
  const canvas = colorRampCanvas(colormapFunction, colormapBounds, { count });
  const url = canvas.toDataURL();
  return url;
}

/**
 * @param {(i: number) => ColorValue} colormapFunction
 * @param {[number, number]} colormapBounds
 * @param {{ count?: number }} options
 * @return {ImageData}
 */
export function colorRampImage(colormapFunction, colormapBounds, { count = 256 } = {}) {
  const canvas = colorRampCanvas(colormapFunction, colormapBounds, { count });
  const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return image;
}