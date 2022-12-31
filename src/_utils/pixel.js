import {add, dot, mix, mul} from './glsl.js';
import {ImageInterpolation} from './image-interpolation.js';

/** @typedef {import('./data').TextureData} TextureData */

/**
 * @param {TextureData} image
 * @param {number} iuvX
 * @param {number} iuvY
 * @param {number} offsetX
 * @param {number} offsetY
 * @return {number[]}
 */
function getPixel(image, iuvX, iuvY, offsetX, offsetY) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);
  const x = iuvX + offsetX;
  const y = iuvY + offsetY;

  return new Array(bandsCount).fill(undefined).map((_, band) => {
    return data[(x + y * width) * bandsCount + band];
  });
}

// cubic B-spline
const BS_A = [ 3, -6,   0, 4].map(x => x / 6);
const BS_B = [-1,  6, -12, 8].map(x => x / 6);

/**
 * @param {number} x
 * @returns {number[]}
 */
function powers(x) { 
  return [x*x*x, x*x, x, 1]; 
}

/**
 * @param {number[]} c0
 * @param {number[]} c1
 * @param {number[]} c2
 * @param {number[]} c3
 * @param {number} a
 * @returns {number[]}
 */
function spline(c0, c1, c2, c3, a) {
  const color = add(add(add(
    mul(c0, dot(BS_B, powers(a + 1.))),
    mul(c1, dot(BS_A, powers(a     )))),
    mul(c2, dot(BS_A, powers(1. - a)))),
    mul(c3, dot(BS_B, powers(2. - a))));

  // fix precision loss in alpha channel
  color[3] = (c0[3] == 255 && c1[3] == 255 && c2[3] == 255 && c3[3] == 255) ? 255 : 0;

  return color;
}

/**
 * see https://www.shadertoy.com/view/XsSXDy
 * @param {TextureData} image
 * @param {number} x
 * @param {number} y
 * @return {number[]}
 */
function getPixelCubic(image, x, y) {
  const iuvX = Math.floor(x);
  const iuvY = Math.floor(y);
  const fuvX = x % 1;
  const fuvY = y % 1;

  return spline(
    spline(getPixel(image, iuvX, iuvY, -1, -1), getPixel(image, iuvX, iuvY, 0, -1), getPixel(image, iuvX, iuvY, 1, -1), getPixel(image, iuvX, iuvY, 2, -1), fuvX),
    spline(getPixel(image, iuvX, iuvY, -1,  0), getPixel(image, iuvX, iuvY, 0,  0), getPixel(image, iuvX, iuvY, 1,  0), getPixel(image, iuvX, iuvY, 2,  0), fuvX),
    spline(getPixel(image, iuvX, iuvY, -1,  1), getPixel(image, iuvX, iuvY, 0,  1), getPixel(image, iuvX, iuvY, 1,  1), getPixel(image, iuvX, iuvY, 2,  1), fuvX),
    spline(getPixel(image, iuvX, iuvY, -1,  2), getPixel(image, iuvX, iuvY, 0,  2), getPixel(image, iuvX, iuvY, 1,  2), getPixel(image, iuvX, iuvY, 2,  2), fuvX),
    fuvY
  );
}

/**
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {TextureData} image
 * @param {number} x
 * @param {number} y
 * @return {number[]}
 */
function getPixelLinear(image, x, y) {
  const iuvX = Math.floor(x);
  const iuvY = Math.floor(y);
  const fuvX = x % 1;
  const fuvY = y % 1;

  return mix(
    mix(getPixel(image, iuvX, iuvY, 0, 0), getPixel(image, iuvX, iuvY, 1, 0), fuvX),
    mix(getPixel(image, iuvX, iuvY, 0, 1), getPixel(image, iuvX, iuvY, 1, 1), fuvX),
    fuvY
  );
}

/**
 * @param {TextureData} image
 * @param {number} x
 * @param {number} y
 * @return {number[]}
 */
function getPixelNearest(image, x, y) {
  const iuvX = Math.round(x);
  const iuvY = Math.round(y);
  
  return getPixel(image, iuvX, iuvY, 0, 0);
}

/**
 * @param {TextureData} image
 * @param {ImageInterpolation} imageInterpolation
 * @param {GeoJSON.Position} point
 * @return {number[]}
 */
function getPixelFilter(image, imageInterpolation, point) {
  // Offset
  // Test case: gfswave/significant_wave_height, Gibraltar (36, -5.5)
  const x = point[0];
  const y = point[1] - 0.5;

  if (imageInterpolation === ImageInterpolation.CUBIC) {
    return getPixelCubic(image, x, y);
  } else if (imageInterpolation === ImageInterpolation.LINEAR) {
    return getPixelLinear(image, x, y);
  } else {
    return getPixelNearest(image, x, y);
  }
}

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {ImageInterpolation} imageInterpolation
 * @param {number} imageWeight
 * @param {GeoJSON.Position} point
 * @return {number[]}
 */
export function getPixelInterpolate(image, image2, imageInterpolation, imageWeight, point) {
  if (image2 && imageWeight > 0) {
    const pixel = getPixelFilter(image, imageInterpolation, point);
    const pixel2 = getPixelFilter(image2, imageInterpolation, point);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageInterpolation, point);
  }
}