import {FEATURES, isWebGL2, hasFeatures, Texture2D} from '@luma.gl/core';
import type {TextureProps} from '@luma.gl/core';
import GL from './gl.js';
import type {TextureData} from './data';

const cache = new WeakMap<WebGLRenderingContext, WeakMap<TextureData, Texture2D>>();

function getTextureProps(gl: WebGLRenderingContext, image: TextureData): TextureProps {
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

  const parameters = {
    // custom interpolation in pixel.glsl
    [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
    [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
    [GL.TEXTURE_WRAP_S]: GL.REPEAT, // TODO: REPEAT for data with bounds -180..180, CLAMP_TO_EDGE for other data
    [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
  };

  return { data: textureData, width, height, format, type, parameters };
}

export function createTextureCached(gl: WebGLRenderingContext, image: TextureData): Texture2D {
  const cache2 = cache.get(gl) ?? (() => {
    const cache2 = new WeakMap<TextureData, Texture2D>()
    cache.set(gl, cache2);
    return cache2;
  })();

  const texture = cache2.get(image) ?? (() => {
    const textureProps = getTextureProps(gl, image);
    const texture = new Texture2D(gl, textureProps);
    cache2.set(image, texture);
    return texture;
  })();
  return texture;
}

// empty texture required instead of null since deck.gl 8.9 because of removal of null check in https://github.com/visgl/deck.gl/commit/b2a25b6b11a3c5197769a911a7482a7c987a12fb
export const EMPTY_TEXTURE = { data: new Uint8Array(), width: 0, height: 0, mipmaps: false } satisfies TextureProps;