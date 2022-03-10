import {Texture2D} from '@luma.gl/core';

/** @typedef {import('./data').TextureData} TextureData */

/** @type {WeakMap<WebGL2RenderingContext, WeakMap<TextureData, Texture2D>>} */
const cache = new WeakMap();

/**
 * @param {WebGL2RenderingContext} gl
 * @param {TextureData} image
 * @returns {Texture2D}
 */
export function createTextureCached(gl, image) {
  if (!cache.has(gl)) {
    cache.set(gl, new WeakMap());
  }

  const glCache = /** @type {WeakMap<TextureData, Texture2D>} */ (cache.get(gl));
  const cachedTexture = glCache.get(image);
  if (cachedTexture) {
    return cachedTexture;
  }

  const texture = new Texture2D(gl, image);
  glCache.set(image, texture);
  return texture;
}