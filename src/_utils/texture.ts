import { FEATURES, isWebGL2, hasFeatures, Texture2D } from '@luma.gl/core';
import type { TextureProps } from '@luma.gl/core';
import GL from './gl.js';
import type { TextureData } from './data.js';

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
    } else if (bandsCount === 1) {
      format = GL.LUMINANCE;
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
    [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
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

// empty texture required instead of null
let emptyTexture: Texture2D | null = null;

export function createEmptyTextureCached(gl: WebGLRenderingContext): Texture2D {
  if (!emptyTexture) {
    emptyTexture = new Texture2D(gl, { data: new Uint8Array(), width: 0, height: 0, mipmaps: false });
  }
  return emptyTexture;
}