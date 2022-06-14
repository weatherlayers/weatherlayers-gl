import {VERSION} from '../_utils/build';
import {loadTextureData, unscaleTextureData} from '../_utils/data';
import {getRasterImage} from '../standalone/providers/raster-provider/raster-image';
import {getContourLines} from '../standalone/providers/contour-provider/contour-line';
import {getHighLowPoints} from '../standalone/providers/high-low-provider/high-low-point';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('../_utils/data').TextureData} TextureData */
/** @typedef {import('../standalone/providers/contour-provider/contour-line').ContourLine} ContourLine */
/** @typedef {import('../standalone/providers/high-low-provider/high-low-point').HighLowPoint} HighLowPoint */
/** @typedef {import('./stac').StacCatalog} StacCatalog */
/** @typedef {import('./stac').StacCollection} StacCollection */
/** @typedef {import('./stac').StacProviderRole} StacProviderRole */
/** @typedef {import('./stac').StacProvider} StacProvider */
/** @typedef {import('./stac').StacAssetRole} StacAssetRole */
/** @typedef {import('./stac').StacItem} StacItem */
/** @typedef {{ url: string, accessToken?: string, format: string }} ClientConfig */

/** @type {ClientConfig} */
const DEFAULT_CLIENT_CONFIG = {
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

export class Client {
  /** @type {ClientConfig} */
  config = undefined;
  /** @type {Map<string, any>} */
  cache = new Map();

  /**
   * @param {Partial<ClientConfig>} config
   */
  constructor(config) {
    this.config = { ...DEFAULT_CLIENT_CONFIG, ...config };
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
   * @param {string} stacCollectionId
   * @returns {Promise<StacCollection>}
   */
  async loadStacCollection(stacCollectionId) {
    const params = new URLSearchParams();
    if (this.config.accessToken) {
      params.set('access_token', this.config.accessToken);
    }
    params.set('version', VERSION);
    const query = params.toString();
    const url = `${this.config.url}/catalog/${stacCollectionId}${query ? `?${query}` : ''}`;
    return loadJsonCached(url, this.cache);
  }

  /**
   * @param {string} stacCollectionId
   * @returns {Promise<Palette>}
   */
  async loadStacCollectionPalette(stacCollectionId) {
    const stacCollection = await this.loadStacCollection(stacCollectionId);
    const asset = Object.values(stacCollection.assets).find(x => x.roles.includes(/** @type {StacAssetRole} */('palette')) && x.type === 'text/plain');
    if (!asset) {
      throw new Error(`Palette asset not found`);
    }
    const url = asset.href;
    return loadTextCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} [linkClass]
   * @returns {Promise<string>}
   */
  async getStacCollectionAttribution(dataset, linkClass) {
    const stacCollection = await client.loadStacCollection(dataset);
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
  getStacCollectionDatetimes(stacCollection) {
    const datetimes = /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'item').map(x => x.datetime).filter(x => !!x));
    return datetimes;
  }

  /**
   * @param {StacCollection} stacCollection
   * @param {string} datetime
   * @returns {string | undefined}
   */
  getStacCollectionClosestStartDatetime(stacCollection, datetime) {
    const datetimes = this.getStacCollectionDatetimes(stacCollection);
    const closestDatetime = [...datetimes].reverse().find(x => x <= datetime);
    return closestDatetime;
  }
  
  /**
   * @param {StacCollection} stacCollection
   * @param {string} datetime
   * @returns {string | undefined}
   */
  getStacCollectionClosestEndDatetime(stacCollection, datetime) {
    const datetimes = this.getStacCollectionDatetimes(stacCollection);
    const closestDatetime = datetimes.find(x => x >= datetime);
    return closestDatetime;
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
   * @param {string} datetime
   * @param {string} [format]
   * @param {Palette} [palette]
   * @returns {Promise<HTMLCanvasElement>}
   */
  async loadStacCollectionRasterImage(dataset, datetime, format, palette) {
    const stacCollection = await client.loadStacCollection(dataset);
    const stacCollectionPalette = await client.loadStacCollectionPalette(dataset)
    palette = palette || stacCollectionPalette;

    const image = await client.loadStacCollectionData(dataset, datetime, format);
    const imageType = stacCollection['weatherLayers:imageType'];
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection['weatherLayers:imageUnscale'] : null;

    const unscaledData = unscaleTextureData(image, imageUnscale);
    const canvas = getRasterImage(unscaledData, imageType, palette);

    return canvas;
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {number} interval
   * @returns {Promise<GeoJSON.FeatureCollection>}
   */
  async loadStacCollectionContourLines(dataset, datetime, interval) {
    const stacCollection = await client.loadStacCollection(dataset);
    const image = await client.loadStacCollectionData(dataset, datetime);
    const imageType = stacCollection['weatherLayers:imageType'];
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection['weatherLayers:imageUnscale'] : null;
    const bounds = stacCollection.extent.spatial.bbox[0];

    const unscaledData = unscaleTextureData(image, imageUnscale);
    const contourLines = await getContourLines(unscaledData, imageType, interval, bounds);

    return { type: 'FeatureCollection', features: contourLines };
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {number} radius
   * @returns {Promise<GeoJSON.FeatureCollection>}
   */
  async loadStacCollectionHighLowPoints(dataset, datetime, radius) {
    const stacCollection = await client.loadStacCollection(dataset);
    const image = await client.loadStacCollectionData(dataset, datetime);
    const imageType = stacCollection['weatherLayers:imageType'];
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection['weatherLayers:imageUnscale'] : null;
    const bounds = stacCollection.extent.spatial.bbox[0];

    const unscaledData = unscaleTextureData(image, imageUnscale);
    const highLowPoints = await getHighLowPoints(unscaledData, imageType, radius, bounds);

    return { type: 'FeatureCollection', features: highLowPoints };
  }
}

/** @type {Partial<ClientConfig>} */
let clientConfig;

/**
 * @param {Partial<ClientConfig>} config
 */
export function setClientConfig(config) {
  clientConfig = config;
}

/** @type {Client} */
let client;

/**
 * @returns {Client}
 */
export function getClient() {
  if (!client) {
    client = new Client(clientConfig);
  }
  return client;
}