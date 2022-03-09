import {mix} from './mix';

/** @typedef {import('./data').FloatData} FloatData */

/**
 * @param {FloatData} image
 * @return {(x: number, y: number, band: number) => number}
 */
function getPixelFunction(image) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  return (x, y, band) => data[(x + y * width) * bandsCount + band];
}

/**
 * manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {FloatData} image
 * @param {number} x
 * @param {number} y
 * @param {number} band
 * @return {number}
 */
export function getPixel(image, x, y, band) {
  const floorX = Math.floor(x);
  const floorY = Math.floor(y);
  const fractX = x % 1;
  const fractY = y % 1;

  const getPixel = getPixelFunction(image);
  const topLeft = getPixel(floorX, floorY, band);
  const topRight = getPixel(floorX + 1, floorY, band);
  const bottomLeft = getPixel(floorX, floorY + 1, band);
  const bottomRight = getPixel(floorX + 1, floorY + 1, band);
  const value = mix(mix(topLeft, topRight, fractX), mix(bottomLeft, bottomRight, fractX), fractY);

  return value;
}