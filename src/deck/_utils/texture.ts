import type {Device, Texture, TextureFormat} from '@luma.gl/core';
import type {TextureData} from './texture-data.js';

const repeatCache = new WeakMap<Device, WeakMap<TextureData, Texture>>();
const clampCache = new WeakMap<Device, WeakMap<TextureData, Texture>>();

function getTextureFormat(device: Device, image: TextureData): TextureFormat {
  const {data, width, height} = image;
  const bandsCount = data.length / (width * height);

  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    if (bandsCount === 4) {
      return 'rgba8unorm';
    } else if (bandsCount === 2) {
      return 'rg8unorm'; // TODO: deck.gl 9 verify
    } else if (bandsCount === 1) {
      return 'r8unorm';
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data instanceof Float32Array) {
    if (!device.features.has('float32-renderable-webgl')) {
      throw new Error('Float textures are required');
    }

    if (bandsCount === 2) {
      return 'rg32float';
    } else if (bandsCount === 1) {
      return 'r32float';
    } else {
      throw new Error('Unsupported data format');
    }
  } else {
    throw new Error('Unsupported data format');
  }
}

export function createTextureCached(device: Device, image: TextureData, repeat: boolean = false): Texture {
  const cache = repeat ? repeatCache : clampCache;
  const cache2 = cache.get(device) ?? (() => {
    const cache2 = new WeakMap<TextureData, Texture>()
    cache.set(device, cache2);
    return cache2;
  })();

  const texture = cache2.get(image) ?? (() => {;
    const texture = device.createTexture({
      format: getTextureFormat(device, image),
      width: image.width,
      height: image.height,
      mipLevels: 1,
      sampler: {
        // custom interpolation in pixel.glsl
        magFilter: 'nearest',
        minFilter: 'nearest',
        addressModeU: repeat ? 'repeat' : 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        lodMaxClamp: 0,
      },
    });
    texture.copyImageData({data: image.data});
    cache2.set(image, texture);
    return texture;
  })();
  return texture;
}

// empty texture required instead of null
let emptyTexture: Texture | null = null;

export function createEmptyTextureCached(device: Device): Texture {
  if (!emptyTexture) {
    emptyTexture = device.createTexture({
      width: 1,
      height: 1,
      mipLevels: 1,
    });
    emptyTexture.copyImageData({data: new Uint8Array([0, 0, 0, 0])});
  }
  return emptyTexture;
}
