import {mix} from './mix';

/** @typedef {import('./data').TextureData} TextureData */

/**
 * @param {TextureData} image
 * @param {number} x
 * @param {number} y
 * @param {number} band
 * @return {number}
 */
function getPixel(image, x, y, band) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);
  return data[(x + y * width) * bandsCount + band];
}

/**
 * texture2D with software bilinear filtering
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {TextureData} image
 * @param {GeoJSON.Position} point
 * @param {number} band
 * @return {number}
 */
function getPixelBilinear(image, point, band) {
  const [x, y] = point;
  const floorX = Math.floor(x);
  const floorY = Math.floor(y);
  const fractX = x % 1;
  const fractY = y % 1;

  const topLeft = getPixel(image, floorX, floorY, band);
  const topRight = getPixel(image, floorX + 1, floorY, band);
  const bottomLeft = getPixel(image, floorX, floorY + 1, band);
  const bottomRight = getPixel(image, floorX + 1, floorY + 1, band);
  return mix(mix(topLeft, topRight, fractX), mix(bottomLeft, bottomRight, fractX), fractY);
}

/**
 * @param {TextureData} image
 * @param {GeoJSON.Position} point
 * @param {number} band
 * @return {number}
 */
function getPixelNearest(image, point, band) {
  const [x, y] = point;
  const roundX = Math.round(x);
  const roundY = Math.round(y);
  return getPixel(image, roundX, roundY, band);
}

/**
 * @param {TextureData} image
 * @param {boolean} imageInterpolate
 * @param {GeoJSON.Position} point
 * @param {number} band
 * @return {number}
 */
function getPixelFilter(image, imageInterpolate, point, band) {
  if (imageInterpolate) {
    return getPixelBilinear(image, point, band);
  } else {
    return getPixelNearest(image, point, band);
  }
}

/**
 * @param {TextureData} image
 * @param {TextureData | null} image2
 * @param {boolean} imageInterpolate
 * @param {number} imageWeight
 * @param {GeoJSON.Position} point
 * @param {number} band
 * @return {number}
 */
export function getPixelInterpolate(image, image2, imageInterpolate, imageWeight, point, band) {
  if (image2 && imageWeight > 0) {
    const pixel = getPixelFilter(image, imageInterpolate, point, band);
    const pixel2 = getPixelFilter(image2, imageInterpolate, point, band);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageInterpolate, point, band);
  }
}