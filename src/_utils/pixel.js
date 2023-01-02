import {frac, add, dot, mul, mix} from './glsl.js';
import {ImageInterpolation} from './image-interpolation.js';

/** @typedef {import('./data').TextureData} TextureData */

/**
 * @param {TextureData} image
 * @param {[number, number]} imageDownscaleResolution
 * @param {number} iuvX
 * @param {number} iuvY
 * @param {number} offsetX
 * @param {number} offsetY
 * @return {number[]}
 */
function getPixel(image, imageDownscaleResolution, iuvX, iuvY, offsetX, offsetY) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  const uvX = (iuvX + offsetX + 0.5) / imageDownscaleResolution[0];
  const uvY = (iuvY + offsetY + 0.5) / imageDownscaleResolution[1];
  const x = Math.floor(uvX * width);
  const y = Math.floor(uvY * height);

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
 * @param {[number, number]} imageDownscaleResolution
 * @param {number} uvX
 * @param {number} uvY
 * @return {number[]}
 */
function getPixelCubic(image, imageDownscaleResolution, uvX, uvY) {
  const tuvX = uvX * imageDownscaleResolution[0] - 0.5;
  const tuvY = uvY * imageDownscaleResolution[1] - 0.5;
  const iuvX = Math.floor(tuvX);
  const iuvY = Math.floor(tuvY);
  const fuvX = frac(tuvX);
  const fuvY = frac(tuvY);

  return spline(
    spline(getPixel(image, imageDownscaleResolution, iuvX, iuvY, -1, -1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0, -1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 1, -1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 2, -1), fuvX),
    spline(getPixel(image, imageDownscaleResolution, iuvX, iuvY, -1,  0), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0,  0), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 1,  0), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 2,  0), fuvX),
    spline(getPixel(image, imageDownscaleResolution, iuvX, iuvY, -1,  1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0,  1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 1,  1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 2,  1), fuvX),
    spline(getPixel(image, imageDownscaleResolution, iuvX, iuvY, -1,  2), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0,  2), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 1,  2), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 2,  2), fuvX),
    fuvY
  );
}

/**
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {TextureData} image
 * @param {[number, number]} imageDownscaleResolution
 * @param {number} uvX
 * @param {number} uvY
 * @return {number[]}
 */
function getPixelLinear(image, imageDownscaleResolution, uvX, uvY) {
  const tuvX = uvX * imageDownscaleResolution[0] - 0.5;
  const tuvY = uvY * imageDownscaleResolution[1] - 0.5;
  const iuvX = Math.floor(tuvX);
  const iuvY = Math.floor(tuvY);
  const fuvX = frac(tuvX);
  const fuvY = frac(tuvY);

  return mix(
    mix(getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0, 0), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 1, 0), fuvX),
    mix(getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0, 1), getPixel(image, imageDownscaleResolution, iuvX, iuvY, 1, 1), fuvX),
    fuvY
  );
}

/**
 * @param {TextureData} image
 * @param {[number, number]} imageDownscaleResolution
 * @param {number} uvX
 * @param {number} uvY
 * @return {number[]}
 */
function getPixelNearest(image, imageDownscaleResolution, uvX, uvY) {
  const tuvX = uvX * imageDownscaleResolution[0] - 0.5;
  const tuvY = uvY * imageDownscaleResolution[1] - 0.5;
  const iuvX = Math.round(tuvX); // nearest
  const iuvY = Math.round(tuvY); // nearest
  
  return getPixel(image, imageDownscaleResolution, iuvX, iuvY, 0, 0);
}

/**
 * @param {TextureData} image
 * @param {[number, number]} imageDownscaleResolution
 * @param {ImageInterpolation} imageInterpolation
 * @param {number} uvX
 * @param {number} uvY
 * @return {number[]}
 */
function getPixelFilter(image, imageDownscaleResolution, imageInterpolation, uvX, uvY) {
  if (imageInterpolation === ImageInterpolation.CUBIC) {
    return getPixelCubic(image, imageDownscaleResolution, uvX, uvY);
  } else if (imageInterpolation === ImageInterpolation.LINEAR) {
    return getPixelLinear(image, imageDownscaleResolution, uvX, uvY);
  } else {
    return getPixelNearest(image, imageDownscaleResolution, uvX, uvY);
  }
}

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {[number, number]} imageDownscaleResolution
 * @param {ImageInterpolation} imageInterpolation
 * @param {number} imageWeight
 * @param {number} uvX
 * @param {number} uvY
 * @return {number[]}
 */
function getPixelInterpolate(image, image2, imageDownscaleResolution, imageInterpolation, imageWeight, uvX, uvY) {
  if (image2 && imageWeight > 0) {
    const pixel = getPixelFilter(image, imageDownscaleResolution, imageInterpolation, uvX, uvY);
    const pixel2 = getPixelFilter(image2, imageDownscaleResolution, imageInterpolation, uvX, uvY);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageDownscaleResolution, imageInterpolation, uvX, uvY);
  }
}

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {number} imageSmoothing
 * @param {ImageInterpolation} imageInterpolation
 * @param {number} imageWeight
 * @param {number} uvX
 * @param {number} uvY
 * @return {number[]}
 */
export function getPixelSmoothInterpolate(image, image2, imageSmoothing, imageInterpolation, imageWeight, uvX, uvY) {
  const { width, height } = image;

  // smooth by downscaling resolution
  const imageDownscaleResolutionFactor = 1 + Math.max(0, imageSmoothing);
  const imageDownscaleResolution = /** @type {[number, number]} */ ([width / imageDownscaleResolutionFactor, height / imageDownscaleResolutionFactor]);

  // offset
  // test case: gfswave/significant_wave_height, Gibraltar (36, -5.5)
  const uvWithOffsetX = uvX + 0.5 / imageDownscaleResolution[0];
  const uvWithOffsetY = uvY;

  return getPixelInterpolate(image, image2, imageDownscaleResolution, imageInterpolation, imageWeight, uvWithOffsetX, uvWithOffsetY);
}