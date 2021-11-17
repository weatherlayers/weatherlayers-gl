/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {VERSION} from '../_utils/build';
import {loadTextureData} from '../_utils/data';

/** @typedef {import('../_utils/data').TextureData} TextureData */
/** @typedef {import('./stac').StacCatalog} StacCatalog */
/** @typedef {import('./stac').StacCollection} StacCollection */
/** @typedef {import('./stac').StacProviderRole} StacProviderRole */
/** @typedef {import('./stac').StacProvider} StacProvider */
/** @typedef {import('./stac').StacItem} StacItem */
/** @typedef {{ url: string, accessToken?: string, format: string }} ClientConfig */

/** @type {ClientConfig} */
const DEFAULT_CLIENT_CONFIG = {
  url: 'https://catalog.weatherlayers.com',
  // url: 'http://localhost:8080',
  format: 'byte.png',
};

/**
 * @template T
 * @param {string} url
 * @return {Promise<T>}
 */
async function loadJson(url) {
  return (await fetch(url)).json();
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
    if (this.config.format) {
      params.set('format', this.config.format);
    }
    params.set('version', VERSION);
    const query = params.toString();
    const url = `${this.config.url}/catalog${query ? `?${query}` : ''}`;
    return loadJsonCached(url, this.cache);
  }

  /**
   * @param {StacCatalog} stacCatalog
   * @returns {string[]}
   */
  getStacCatalogCollectionIds(stacCatalog) {
    const ids = /** @type {string[]} */ (stacCatalog.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
    return ids;
  }

  /**
   * @param {string} stacCollectionId
   * @returns {Promise<StacCollection>}
   */
  async loadStacCollection(stacCollectionId) {
    const stacCatalog = await this.loadStacCatalog();
    const link = stacCatalog.links.find(x => x.id === stacCollectionId);
    if (!link) {
      throw new Error(`Collection ${stacCollectionId} not found`);
    }
    return loadJsonCached(link.href, this.cache);
  }

  /**
   * @param {StacCollection} stacCollection
   * @param {string} [linkClass]
   * @returns {string}
   */
  getStacCollectionAttribution(stacCollection, linkClass) {
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
  async loadStacItemByDatetime(dataset, datetime) {
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
   * @returns {Promise<TextureData>}
   */
  async loadStacCollectionDataByDatetime(dataset, datetime) {
    const stacItem = await this.loadStacItemByDatetime(dataset, datetime);
    const url = stacItem.assets.data.href;
    return loadTextureDataCached(url, this.cache);
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