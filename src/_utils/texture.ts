import type { Device, Texture, TextureProps, TextureFormat } from '@luma.gl/core';
import type { TextureData } from './data.js';

const cache = new WeakMap<Device, WeakMap<TextureData, Texture>>();

function getTextureProps(device: Device, image: TextureData): TextureProps {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  let format: TextureFormat;
  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    if (bandsCount === 4) {
      format = 'rgba8unorm';
    } else if (bandsCount === 2) {
      format = 'rg8unorm'; // TODO: deck.gl 9 verify
    } else if (bandsCount === 1) {
      format = 'r8unorm';
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data instanceof Float32Array) {
    if (!device.features.has('float32-renderable-webgl')) {
      throw new Error('Float textures are required');
    }

    if (bandsCount === 2) {
      format = 'rg32float';
    } else if (bandsCount === 1) {
      format = 'r32float';
    } else {
      throw new Error('Unsupported data format');
    }
  } else {
    throw new Error('Unsupported data format');
  }

  return {
    data,
    width,
    height,
    format,
    sampler: {
      // custom interpolation in pixel.glsl
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    },
  };
}

export function createTextureCached(device: Device, image: TextureData): Texture {
  const cache2 = cache.get(device) ?? (() => {
    const cache2 = new WeakMap<TextureData, Texture>()
    cache.set(device, cache2);
    return cache2;
  })();

  const texture = cache2.get(image) ?? (() => {
    const textureProps = getTextureProps(device, image);
    const texture = device.createTexture(textureProps);
    cache2.set(image, texture);
    return texture;
  })();
  return texture;
}

// empty texture required instead of null
let emptyTexture: Texture | null = null;

export function createEmptyTextureCached(device: Device): Texture {
  if (!emptyTexture) {
    emptyTexture = device.createTexture({ data: new Uint8Array(), width: 0, height: 0, mipmaps: false });
  }
  return emptyTexture;
}
