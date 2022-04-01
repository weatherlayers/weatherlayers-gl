import * as GeoTIFF from 'geotiff';
import GL from '@luma.gl/constants';
import {ImageType} from './image-type';
import {mix} from './mix';

/** @typedef {import('./image-type').ImageType} ImageType */
/** @typedef {Uint8Array | Uint8ClampedArray | Float32Array} TextureDataArray */
/** @typedef {{ data: TextureDataArray, width: number, height: number }} TextureData */
/** @typedef {Float32Array} FloatDataArray */
/** @typedef {{ data: FloatDataArray, width: number, height: number }} FloatData */

/**
 * @param {TextureDataArray} data
 * @param {number} [nodata]
 * @returns {TextureDataArray}
 */
function maskData(data, nodata = undefined) {
  if (nodata == undefined) {
    return data;
  }

  // sea_ice_fraction:
  // - real nodata: 1.27999997138977
  // - meta nodata: 1.27999997138977095, parsed in JS as 1.279999971389771
  const maskedData = new data.constructor(Array.from(data).map(value => {
    return Math.abs(value - nodata) > Number.EPSILON * 2 ? value : NaN;
  }));

  return maskedData;
}

/**
 * @param {TextureData} textureData
 * @returns {number}
 */
export function getTextureDataFormat(textureData) {
  const { data, width, height } = textureData;
  const bandsCount = data.length / (width * height);

  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    if (bandsCount === 4) {
      return GL.RGBA;
    } else if (bandsCount === 2) {
      return GL.LUMINANCE_ALPHA;
    } else {
      throw new Error('Unsupported data format');
    }
  } else if (data instanceof Float32Array) {
    if (bandsCount === 2) {
      return GL.RG32F;
    } else if (bandsCount === 1) {
      return GL.R32F;
    } else {
      throw new Error('Unsupported data format');
    }
  } else {
    throw new Error('Unsupported data format');
  }
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
async function loadImage(url) {
  const blob = await (await fetch(url)).blob();

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const textureData = { data, width, height };
  return textureData;
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
async function loadGeotiff(url) {
  const geotiff = await GeoTIFF.fromUrl(url, { allowFullFile: true });
  const geotiffImage = await geotiff.getImage(0);

  const sourceData = await geotiffImage.readRasters({ interleave: true });
  const nodata = geotiffImage.getGDALNoData();
  const data = maskData(sourceData, nodata);

  const width = geotiffImage.getWidth();
  const height = geotiffImage.getHeight();

  const textureData = { data, width, height };
  return textureData;
}

/**
 * @param {string} url
 * @returns {Promise<TextureData>}
 */
export function loadTextureData(url) {
  if (url.includes('.png')) {
    return loadImage(url);
  } else if (url.includes('.tif')) {
    return loadGeotiff(url);
  } else {
    throw new Error('Unsupported data format');
  }
}

/**
 * @param {TextureData} textureData
 * @param {[number, number] | null} imageUnscale
 * @returns {FloatData}
 */
export function unscaleTextureData(textureData, imageUnscale) {
  const { data, width, height } = textureData;
  const bandsCount = data.length / (width * height);

  const imageUnscaleDelta = imageUnscale ? imageUnscale[1] - imageUnscale[0] : 0;
  const newBandsCount = imageUnscale ? bandsCount - 1 : bandsCount;

  const unscaledData = new Float32Array(width * height * newBandsCount);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = (x + y * width) * bandsCount + bandsCount - 1;

      for (let band = 0; band < newBandsCount; band++) {
        const i = (x + y * width) * bandsCount + band;
        const j = (x + y * width) * newBandsCount + band;
  
        // raster_has_value
        if (imageUnscale) {
          if (data[a] !== 255) {
            unscaledData[j] = NaN;
            continue;
          }
        } else {
          if (isNaN(data[i])) {
            unscaledData[j] = NaN;
            continue;
          }
        }

        // raster_get_value
        let value;
        if (imageUnscale) {
          value = imageUnscale[0] + (data[i] / 255) * imageUnscaleDelta;
        } else {
          value = data[i];
        }

        unscaledData[j] = value;
      }
    }
  }

  return { data: unscaledData, width, height };
}

/**
 * @param {FloatData} image
 * @param {FloatData} image2
 * @param {number} imageWeight
 * @returns {FloatData}
 */
export function interpolateTextureData(image, image2, imageWeight) {
  const { data, width, height } = image;
  const { data: data2 } = image2;
  const bandsCount = data.length / (width * height);

  const interpolatedData = new Float32Array(width * height * bandsCount);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let band = 0; band < bandsCount; band++) {
        const i = (x + y * width) * bandsCount + band;

        let value = data[i];
        if (imageWeight > 0) {
          value = mix(value, data2[i], imageWeight);
        }

        interpolatedData[i] = value;
      }
    }
  }

  return { data: interpolatedData, width, height };
}

/**
 * @param {number} pixel1
 * @param {number} pixel2
 * @param {boolean} imageTypeVector
 * @returns {number}
 */
export function getValue(pixel1, pixel2, imageTypeVector) {
  if (imageTypeVector) {
    return Math.hypot(pixel1, pixel2);
  } else {
    return pixel1;
  }
}

/**
 * @param {FloatData} image
 * @param {ImageType} imageType
 * @returns {FloatData}
 */
export function getValueData(image, imageType) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  const imageTypeVector = imageType === ImageType.VECTOR;

  const valueData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * bandsCount;
      const j = x + y * width;

      // raster_has_value
      if (isNaN(data[i])) {
        valueData[j] = NaN;
        continue;
      }

      // raster_get_value
      const value = getValue(data[i], data[i + 1], imageTypeVector);

      valueData[j] = value;
    }
  }

  return { data: valueData, width, height };
}

/**
 * @param {number} pixel1
 * @param {number} pixel2
 * @param {boolean} imageTypeVector
 * @returns {number}
 */
export function getDirection(pixel1, pixel2, imageTypeVector) {
  if (imageTypeVector) {
    return ((360 - (Math.atan2(pixel2, pixel1) / Math.PI * 180 + 180)) - 270) % 360;
  } else {
    return NaN;
  }
}

/**
 * @param {FloatData} image
 * @param {ImageType} imageType
 * @returns {FloatData}
 */
export function getDirectionData(image, imageType) {
  const { data, width, height } = image;
  const bandsCount = data.length / (width * height);

  const imageTypeVector = imageType === ImageType.VECTOR;

  const directionData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * bandsCount;
      const j = x + y * width;

      // raster_has_value
      if (isNaN(data[i])) {
        directionData[j] = NaN;
        continue;
      }

      // raster_get_direction_value
      const value = getDirection(data[i], data[i + 1], imageTypeVector);

      directionData[j] = value;
    }
  }

  return { data: directionData, width, height };
}