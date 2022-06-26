import {FEATURES, isWebGL2, hasFeatures, Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';

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
 * @returns {any}
 */
function getTextureOptions(gl, image, imageInterpolate) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  let type;
  let format;
  let textureData;
  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    type = GL.UNSIGNED_BYTE;
    if (bandsCount === 4) {
      format = GL.RGBA;
      textureData = data;
    } else if (bandsCount === 2) {
      format = GL.LUMINANCE_ALPHA;
      textureData = data;
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data instanceof Float32Array) {
    if (!hasFeatures(gl, FEATURES.TEXTURE_FLOAT)) {
      throw new Error('Float textures are required');
    }

    type = GL.FLOAT;
    if (bandsCount === 2) {
      if (isWebGL2(gl)) {
        format = GL.RG32F;
        textureData = data;
      } else {
        format = GL.RGB;
        textureData = new Float32Array(width * height * 3);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (x + y * width) * 2;
            const j = (x + y * width) * 3;

            textureData[j] = data[i];
            textureData[j + 1] = data[i + 1];
            textureData[j + 2] = NaN;
          }
        }
      }
    } else if (bandsCount === 1) {
      if (isWebGL2(gl)) {
        format = GL.R32F;
        textureData = data;
      } else {
        format = GL.RGB;
        textureData = new Float32Array(width * height * 3);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = x + y * width;
            const j = (x + y * width) * 3;

            textureData[j] = data[i];
            textureData[j + 1] = NaN;
            textureData[j + 2] = NaN;
          }
        }
      }
    } else {
      throw new Error('Unsupported data format');
    }
  } else {
    throw new Error('Unsupported data format');
  }

  const parameters = imageInterpolate ? LINEAR_TEXTURE_PARAMETERS : NEAREST_TEXTURE_PARAMETERS;

  return { data: textureData, width, height, format, type, parameters };
}

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
    const textureOptions = getTextureOptions(gl, image, imageInterpolate);
    const texture = new Texture2D(gl, textureOptions);
    cache3.set(parameters, texture);
  }

  const texture = cache3.get(parameters);
  return texture;
}