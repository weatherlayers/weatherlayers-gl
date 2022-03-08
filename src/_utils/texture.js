import {Texture2D} from '@luma.gl/core';

/** @typedef {import('./data').TextureData} TextureData */

/** @type {WeakMap<TextureData, Texture2D>} */
const cache = new WeakMap();

/**
 * @param {WebGL2RenderingContext} gl
 * @param {TextureData} image
 * @returns {Texture2D}
 */
export function createTextureCached(gl, image) {
  const cachedTexture = cache.get(image);
  if (cachedTexture) {
    return cachedTexture;
  }

  const texture = new Texture2D(gl, image);
  cache.set(image, texture);
  return texture;
}