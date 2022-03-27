import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {getTextureDataFormat} from './data';

/** @typedef {import('./data').TextureData} TextureData */
/** @typedef {any} TextureParameters */

/** @type {TextureParameters} */
const LINEAR_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
};

/** @type {TextureParameters} */
const NEAREST_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
};

/** @type {WeakMap<WebGL2RenderingContext, WeakMap<TextureData, WeakMap<TextureParameters, Texture2D>>>} */
const cache = new WeakMap();

/**
 * @param {WebGL2RenderingContext} gl
 * @param {TextureData} image
 * @param {boolean} imageInterpolate
 * @returns {Texture2D}
 */
export function createTextureCached(gl, image, imageInterpolate) {
  const parameters = imageInterpolate ? LINEAR_TEXTURE_PARAMETERS : NEAREST_TEXTURE_PARAMETERS;

  if (!cache.has(gl)) {
    cache.set(gl, new WeakMap());
  }

  const cache2 = /** @type {WeakMap<TextureData, WeakMap<TextureParameters, Texture2D>>} */ (cache.get(gl));
  if (!cache2.has(image)) {
    cache2.set(image, new WeakMap());
  }

  const cache3 = /** @type {WeakMap<TextureParameters, Texture2D>} */ (cache2.get(image));
  if (!cache3.has(parameters)) {
    const format = getTextureDataFormat(image);
    const texture = new Texture2D(gl, { ...image, format, parameters });
    cache3.set(parameters, texture);
  }

  const texture = cache3.get(parameters);
  return texture;
}