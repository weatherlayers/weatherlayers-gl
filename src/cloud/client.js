import {VERSION} from '../_utils/build';
import {loadTextureData} from '../_utils/data';
import {getDatetimeWeight, getClosestStartDatetime, getClosestEndDatetime} from '../_utils/datetime';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('../_utils/data').TextureData} TextureData */
/** @typedef {import('../_utils/unit-format').UnitFormat} UnitFormat */
/** @typedef {import('../_utils/stac').StacCatalog} StacCatalog */
/** @typedef {import('../_utils/stac').StacCollection} StacCollection */
/** @typedef {import('../_utils/stac').StacProviderRole} StacProviderRole */
/** @typedef {import('../_utils/stac').StacProvider} StacProvider */
/** @typedef {import('../_utils/stac').StacAssetRole} StacAssetRole */
/** @typedef {import('../_utils/stac').StacItem} StacItem */
/** @typedef {import('../_utils/stac').StacCollectionImageType} StacCollectionImageType */
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
 * @param {string} url
 * @param {string} [accessToken]
 * @returns {string}
 */
function getAuthenticatedUrl(url, accessToken = undefined) {
  const params = new URLSearchParams();
  if (!url.includes('access_token=') && accessToken) {
    params.set('access_token', accessToken);
  }
  if (!url.includes('version=')) {
    params.set('version', VERSION);
  }
  const query = params.toString();
  const fullUrl = `${url}${query ? `?${query}` : ''}`;
  return fullUrl;
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
 * @returns {UnitFormat}
 */
function getStacCollectionUnitFormat(stacCollection) {
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
    const url = getAuthenticatedUrl(`${this.config.url}/catalog`, this.config.accessToken);
    return loadJsonCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @returns {Promise<StacCollection>}
   */
  async loadStacCollection(dataset) {
    const url = getAuthenticatedUrl(`${this.config.url}/catalog/${dataset}`, this.config.accessToken);
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
    const url = getAuthenticatedUrl(asset.href, this.config.accessToken);
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
    const url = getAuthenticatedUrl(link.href, this.config.accessToken);
    return loadJsonCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {string} [format]
   * @returns {Promise<TextureData>}
   */
  async loadStacCollectionData(dataset, datetime, format = this.config.format) {
    const stacItem = await this.loadStacItem(dataset, datetime);
    const url = getAuthenticatedUrl(stacItem.assets[`data.${format}`].href, this.config.accessToken);
    return loadTextureDataCached(url, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} [linkClass]
   * @returns {Promise<{title: string, unitFormat: UnitFormat, attribution: string, datetimes: string[], palette: Palette}>}
   */
  async loadStacCollectionProperties(dataset, linkClass = undefined) {
    const stacCollection = await this.loadStacCollection(dataset);
    const title = getStacCollectionTitle(stacCollection);
    const unitFormat = getStacCollectionUnitFormat(stacCollection);
    const attribution = getStacCollectionAttribution(stacCollection, linkClass);
    const datetimes = getStacCollectionDatetimes(stacCollection);
    const palette = await this.loadStacCollectionPalette(dataset);

    return {title, unitFormat, attribution, datetimes, palette};
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
}