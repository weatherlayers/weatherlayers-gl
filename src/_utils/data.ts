import * as GeoTIFF from 'geotiff';

export type TextureDataArray = GeoTIFF.TypedArray | Uint8ClampedArray;

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

export type LoadFunction<T> = (url: string) => Promise<T>;
export type CachedLoadFunction<T> = (url: string, cache?: Map<string, T | Promise<T>> | false) => T | Promise<T>;

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

async function loadImage(url: string): Promise<TextureData> {
  const blob = await (await fetch(url)).blob();

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const textureData = { data, width, height };
  return textureData;
}

async function loadGeotiff(url: string): Promise<TextureData> {
  // larger blockSize helps with errors, see https://github.com/geotiffjs/geotiff/issues/218
  const geotiff = await GeoTIFF.fromUrl(url, { allowFullFile: true, blockSize: 10*1024*1024 });
  const geotiffImage = await geotiff.getImage(0);

  const sourceData = await geotiffImage.readRasters({ interleave: true }) as GeoTIFF.TypedArray;
  const nodata = geotiffImage.getGDALNoData();
  const data = maskData(sourceData, nodata);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const textureData = { data, width, height };
  return textureData;
}

function loadCached<T>(loadFunction: LoadFunction<T>): CachedLoadFunction<T> {
  return (url, cache = DEFAULT_CACHE) => {
    if (cache === false) {
      return loadFunction(url);
    }

    const dataOrPromise = cache.get(url);
    if (dataOrPromise) {
      return dataOrPromise;
    }
    
    const dataPromise = loadFunction(url);
    cache.set(url, dataPromise);
    dataPromise.then(data => {
      cache.set(url, data);
    });
    return dataPromise;
  };
}

export const loadTextureData = loadCached(url => {
  if (url.includes('.png')) {
    return loadImage(url);
  } else if (url.includes('.tif')) {
    return loadGeotiff(url);
  } else {
    throw new Error('Unsupported data format');
  }
});

export const loadJson = loadCached(async url => {
  return (await fetch(url)).json();
});

export const loadText = loadCached(async url => {
  return (await fetch(url)).text();
});