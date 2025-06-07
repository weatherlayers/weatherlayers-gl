import type {TypedArrayWithDimensions} from 'geotiff';
import {getLibrary} from './library.js';

export type TextureDataArray = Uint8Array | Uint8ClampedArray | Float32Array;

export interface TextureData {
  data: TextureDataArray;
  width: number;
  height: number;
}

export type FloatDataArray = Float32Array;

export interface FloatData {
  data: FloatDataArray;
  width: number;
  height: number;
}

export interface LoadOptions {
  headers?: Record<string, string>;
}

export interface CachedLoadOptions<T> extends LoadOptions {
  cache?: Map<string, T | Promise<T>> | false;
}

export type LoadFunction<T> = (url: string, options?: LoadOptions) => Promise<T>;
export type CachedLoadFunction<T> = (url: string, options?: CachedLoadOptions<T>) => Promise<T>;

const DEFAULT_CACHE = new Map<string, any>();

function maskData(data: TextureDataArray, nodata: number | null): TextureDataArray {
  if (nodata == undefined) {
    return data;
  }

  // sea_ice_fraction:
  // - real nodata: 1.27999997138977
  // - meta nodata: 1.27999997138977095, parsed in JS as 1.279999971389771
  const maskedData = data.slice(0);
  for (let i = 0; i < maskedData.length; i++) {
    if (Math.abs(maskedData[i] - nodata) < Number.EPSILON * 2) {
      maskedData[i] = NaN;
    }
  }

  return maskedData;
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataArray = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataArray);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function loadImage(url: string, options?: LoadOptions): Promise<TextureData> {
  // if custom headers are provided, load the url as blob
  let blobUrl: string | undefined;
  if (options?.headers) {
    const response = await fetch(url, {headers: options.headers});
    if (!response.ok) {
      throw new Error(`URL ${url} can't be loaded. Status: ${response.status}`);
    }
    const blob = await response.blob();
    blobUrl = URL.createObjectURL(blob);
  }

  // otherwise, load the url as image, to allow for a lower CSP policy
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve);
      image.addEventListener('error', reject);
      image.crossOrigin = 'anonymous';
      image.src = blobUrl ?? url;
    });
    await image.decode();
  } catch (e) {
    throw new Error(`Image ${url} can't be decoded.`, {cause: e});
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const {data, width, height} = imageData;

  const textureData = {data, width, height};
  return textureData;
}

async function loadGeotiff(url: string, options?: LoadOptions): Promise<TextureData> {
  const GeoTIFF = await getLibrary('geotiff');

  let geotiff;
  try {
    geotiff = await GeoTIFF.fromUrl(url, {
      allowFullFile: true,
      blockSize: Number.MAX_SAFE_INTEGER, // larger blockSize helps with errors, see https://github.com/geotiffjs/geotiff/issues/218
      fetch: (url: string, init?: RequestInit) => fetch(url, {...init, headers: {...init?.headers, ...options?.headers}}),
    });
  } catch (e) {
    throw new Error(`Image ${url} can't be decoded.`, {cause: e});
  }
  const geotiffImage = await geotiff.getImage(0);

  const sourceData = await geotiffImage.readRasters({interleave: true}) as TypedArrayWithDimensions;
  if (!(sourceData instanceof Uint8Array || sourceData instanceof Uint8ClampedArray || sourceData instanceof Float32Array)) {
    throw new Error('Unsupported data format');
  }
  const nodata = geotiffImage.getGDALNoData();
  const data = maskData(sourceData, nodata);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const textureData = {data, width, height};
  return textureData;
}

function loadCached<T>(loadFunction: LoadFunction<T>): CachedLoadFunction<T> {
  return async (url: string, options?: CachedLoadOptions<T>) => {
    if (options?.cache === false) {
      return loadFunction(url);
    }

    const cache = options?.cache ?? DEFAULT_CACHE;
    const cacheKey = await sha256(url + JSON.stringify(options?.headers));
    const dataOrPromise = cache.get(cacheKey);
    if (dataOrPromise) {
      return dataOrPromise;
    }
    
    const optionsWithoutCache = {...options, cache: undefined};
    const dataPromise = loadFunction(url, optionsWithoutCache);
    cache.set(cacheKey, dataPromise);
    dataPromise.then(data => {
      cache.set(cacheKey, data);
    });
    return dataPromise;
  };
}

export const loadTextureData = loadCached(async (url: string, options?: LoadOptions) => {
  if (url.includes('.png') || url.includes('.webp') || url.includes('image/png') || url.includes('image/webp')) {
    return loadImage(url, options);
  } else if (url.includes('.tif') || url.includes('image/tif')) {
    return loadGeotiff(url, options);
  } else {
    throw new Error('Unsupported data format');
  }
});

export const loadJson = loadCached(async (url: string, options?: LoadOptions)  => {
  const response = await fetch(url, {headers: options?.headers});
  if (!response.ok) {
    throw new Error(`URL ${url} can't be loaded. Status: ${response.status}`);
  }
  return response.json();
});