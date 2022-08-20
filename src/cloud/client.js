import {VERSION} from '../_utils/build';
import {loadTextureData} from '../_utils/data';
import {getDatetimeWeight, getClosestStartDatetime, getClosestEndDatetime} from '../_utils/datetime';
import {getRasterImage} from '../standalone/providers/raster-provider/raster-image';
import {getContourLines} from '../standalone/providers/contour-provider/contour-line';
import {getHighLowPoints} from '../standalone/providers/high-low-provider/high-low-point';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('../_utils/data').TextureData} TextureData */
/** @typedef {import('../standalone/providers/contour-provider/contour-line').ContourLine} ContourLine */
/** @typedef {import('../standalone/providers/high-low-provider/high-low-point').HighLowPoint} HighLowPoint */
/** @typedef {import('../standalone/providers/grid-provider/grid-point').GridPoint} GridPoint */
/** @typedef {import('./stac').StacCatalog} StacCatalog */
/** @typedef {import('./stac').StacCollection} StacCollection */
/** @typedef {import('./stac').StacProviderRole} StacProviderRole */
/** @typedef {import('./stac').StacProvider} StacProvider */
/** @typedef {import('./stac').StacAssetRole} StacAssetRole */
/** @typedef {import('./stac').StacItem} StacItem */
/** @typedef {import('./stac').StacRasterUnit} StacRasterUnit */
/** @typedef {import('./stac').StacCollectionImageType} StacCollectionImageType */
/** @typedef {import('./client').ClientConfig} ClientConfig */

/** @type {ClientConfig} */
const DEFAULT_CONFIG = {
  url: 'https://catalog.weatherlayers.com',
  // url: 'http://localhost:8080',
  format: 'byte.png',
};

/**
 * @param {string} url
 * @return {Promise<string>}
 */
async function loadText(url) {
  return (await fetch(url)).text();
}

/**
 * @template T
 * @param {string} url
 * @return {Promise<T>}
 */
async function loadJson(url) {
  return (await fetch(url)).json();
}

/**
 * @param {string} url
 * @param {Map<string, any>} cache
 * @return {Promise<string>}
 */
function loadTextCached(url, cache) {
  const dataOrPromise = cache.get(url);
  if (dataOrPromise) {
    return dataOrPromise;
  }
  
  const dataPromise = loadText(url);
  cache.set(url, dataPromise);
  dataPromise.then(data => {
    cache.set(url, data);
  });
  return dataPromise;
}

/**
 * @template T
 * @param {string} url
 * @param {Map<string, any>} cache
 * @return {Promise<T>}
 */
function loadJsonCached(url, cache) {
  const dataOrPromise = cache.get(url);
  if (dataOrPromise) {
    return dataOrPromise;
  }
  
  const dataPromise = loadJson(url);
  cache.set(url, dataPromise);
  dataPromise.then(data => {
    cache.set(url, data);
  });
  return dataPromise;
}

/**
 * @param {string} url
 * @param {Map<string, any>} cache
 * @returns {Promise<TextureData>}
 */
function loadTextureDataCached(url, cache) {
  const dataOrPromise = cache.get(url);
  if (dataOrPromise) {
    return dataOrPromise;
  }
  
  const dataPromise = loadTextureData(url);
  cache.set(url, dataPromise);
  dataPromise.then(data => {
    cache.set(url, data);
  });
  return dataPromise;
}

/**
 * @param {StacCollection} stacCollection
 * @returns {string}
 */
function getStacCollectionTitle(stacCollection) {
  return stacCollection.title;
}

/**
 * @param {StacCollection} stacCollection
 * @returns {StacRasterUnit}
 */
function getStacCollectionUnit(stacCollection) {
  return stacCollection['weatherLayers:units'][0];
}

/**
 * @param {StacCollection} stacCollection
 * @param {string} [linkClass]
 * @returns {string}
 */
function getStacCollectionAttribution(stacCollection, linkClass = undefined) {
  const producer = stacCollection.providers.find(x => x.roles.includes(/** @type {StacProviderRole} */('producer')));
  const processor = stacCollection.providers.find(x => x.roles.includes(/** @type {StacProviderRole} */('processor')));
  const attribution = [
    ...(producer ? [`<a href="${producer.url}"${linkClass ? ` class="${linkClass}"`: ''}>${producer.name}</a>`] : []),
    ...(processor ? [`<a href="${processor.url}"${linkClass ? ` class="${linkClass}"`: ''}>${processor.name}</a>`] : []),
  ].join(' via ');
  return attribution;
}

/**
 * @param {StacCollection} stacCollection
 * @returns {string[]}
 */
function getStacCollectionDatetimes(stacCollection) {
  const datetimes = /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'item').map(x => x.datetime).filter(x => !!x));
  return datetimes;
}

/**
 * @param {StacCollection} stacCollection
 * @returns {StacCollectionImageType}
 */
function getStacCollectionImageType(stacCollection) {
  return stacCollection['weatherLayers:imageType'];
}

/**
 * @param {StacCollection} stacCollection
 * @returns {[number, number]}
 */
function getStacCollectionImageUnscale(stacCollection) {
  return stacCollection['weatherLayers:imageUnscale'];
}

/**
 * @param {StacCollection} stacCollection
 * @returns {[number, number, number, number]}
 */
function getStacCollectionBounds(stacCollection) {
  return stacCollection.extent.spatial.bbox[0];
}

export class Client {
  /** @type {ClientConfig} */
  config;
  /** @type {Map<string, any>} */
  cache = new Map();

  /**
   * @param {Partial<ClientConfig>} config
   */
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * @returns {Promise<StacCatalog>}
   */
  async loadStacCatalog() {
    const params = new URLSearchParams();
    if (this.config.accessToken) {
      params.set('access_token', this.config.accessToken);
    }
    params.set('version', VERSION);
    const query = params.toString();
    const url = `${this.config.url}/catalog${query ? `?${query}` : ''}`;
    return loadJsonCached(url, this.cache);
  }

  /**
   * @param {StacCatalog} stacCatalog
   * @returns {Promise<string[]>}
   */
  async loadStacCatalogChildCollectionIds(stacCatalog) {
    const ids = /** @type {string[]} */ (stacCatalog.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
    const childIds = (await Promise.all(ids.map(async id => {
      const stacCollection = await this.loadStacCollection(id);
      const childIds = /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
      return childIds;
    }))).flat();
    return childIds;
  }

  /**
   * @param {string} dataset
   * @returns {Promise<StacCollection>}
   */
  async loadStacCollection(dataset) {
    const params = new URLSearchParams();
    if (this.config.accessToken) {
      params.set('access_token', this.config.accessToken);
    }
    params.set('version', VERSION);
    const query = params.toString();
    const url = `${this.config.url}/catalog/${dataset}${query ? `?${query}` : ''}`;
    return loadJsonCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @returns {Promise<Palette>}
   */
  async loadStacCollectionPalette(dataset) {
    const stacCollection = await this.loadStacCollection(dataset);
    const asset = Object.values(stacCollection.assets).find(x => x.roles.includes(/** @type {StacAssetRole} */('palette')) && x.type === 'text/plain');
    if (!asset) {
      throw new Error(`Palette asset not found`);
    }
    const url = asset.href;
    return loadTextCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @returns {Promise<StacItem>}
   */
  async loadStacItem(dataset, datetime) {
    const stacCollection = await this.loadStacCollection(dataset);
    const link = stacCollection.links.find(x => x.rel === 'item' && x.datetime === datetime);
    if (!link) {
      throw new Error(`Item ${datetime} not found`);
    }
    return loadJsonCached(link.href, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {string} [format]
   * @returns {Promise<TextureData>}
   */
  async loadStacCollectionData(dataset, datetime, format = this.config.format) {
    const stacItem = await this.loadStacItem(dataset, datetime);
    const url = stacItem.assets[`data.${format}`].href;
    return loadTextureDataCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} [linkClass]
   * @returns {Promise<{title: string, unit: StacRasterUnit, attribution: string, datetimes: string[], palette: Palette}>}
   */
  async loadStacCollectionProperties(dataset, linkClass = undefined) {
    const stacCollection = await this.loadStacCollection(dataset);
    const title = getStacCollectionTitle(stacCollection);
    const unit = getStacCollectionUnit(stacCollection);
    const attribution = getStacCollectionAttribution(stacCollection, linkClass);
    const datetimes = getStacCollectionDatetimes(stacCollection);
    const palette = await this.loadStacCollectionPalette(dataset);

    return {title, unit, attribution, datetimes, palette};
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {boolean} datetimeInterpolate
   * @param {string} [format]
   * @returns {Promise<{image: TextureData, image2: TextureData | null, imageWeight: number, imageType: StacCollectionImageType, imageUnscale: [number, number] | null, bounds: [number, number, number, number]}>}
   */
  async loadStacCollectionDataProperties(dataset, datetime, datetimeInterpolate, format = this.config.format) {
    const stacCollection = await this.loadStacCollection(dataset);
    const datetimes = getStacCollectionDatetimes(stacCollection);
    const startDatetime = getClosestStartDatetime(datetimes, datetime);
    const endDatetime = getClosestEndDatetime(datetimes, datetime);

    if (!startDatetime) {
      throw new Error('No data found');
    }

    const [image, image2] = await Promise.all([
      this.loadStacCollectionData(dataset, startDatetime, format),
      endDatetime ? this.loadStacCollectionData(dataset, endDatetime, format) : null,
    ]);

    const imageWeight = datetimeInterpolate && startDatetime && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;
    const imageType = getStacCollectionImageType(stacCollection);
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? getStacCollectionImageUnscale(stacCollection) : null;
    const bounds = getStacCollectionBounds(stacCollection);
    
    return {image, image2, imageWeight, imageType, imageUnscale, bounds};
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {Palette} palette
   * @param {string} [format]
   * @returns {Promise<HTMLCanvasElement>}
   */
  async loadStacCollectionRasterImage(dataset, datetime, palette, format = undefined) {
    const stacCollection = await this.loadStacCollection(dataset);
    const image = await this.loadStacCollectionData(dataset, datetime, format);
    const imageType = getStacCollectionImageType(stacCollection);
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? getStacCollectionImageUnscale(stacCollection) : null;

    const canvas = getRasterImage(image, imageType, imageUnscale, palette);

    return canvas;
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {number} interval
   * @returns {Promise<GeoJSON.FeatureCollection>}
   */
  async loadStacCollectionContourLines(dataset, datetime, interval) {
    const stacCollection = await this.loadStacCollection(dataset);
    const image = await this.loadStacCollectionData(dataset, datetime);
    const imageType = getStacCollectionImageType(stacCollection);
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? getStacCollectionImageUnscale(stacCollection) : null;
    const bounds = getStacCollectionBounds(stacCollection);

    const contourLines = await getContourLines(image, imageType, imageUnscale, interval, bounds);

    return { type: 'FeatureCollection', features: contourLines };
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {number} radius
   * @returns {Promise<GeoJSON.FeatureCollection>}
   */
  async loadStacCollectionHighLowPoints(dataset, datetime, radius) {
    const stacCollection = await this.loadStacCollection(dataset);
    const image = await this.loadStacCollectionData(dataset, datetime);
    const imageType = getStacCollectionImageType(stacCollection);
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? getStacCollectionImageUnscale(stacCollection) : null;
    const bounds = getStacCollectionBounds(stacCollection);

    const highLowPoints = await getHighLowPoints(image, imageType, imageUnscale, radius, bounds);

    return { type: 'FeatureCollection', features: highLowPoints };
  }
}