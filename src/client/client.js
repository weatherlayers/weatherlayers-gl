import {VERSION} from '../_utils/build.js';
import {loadTextureData, loadJson, loadText} from '../_utils/data.js';
import {getDatetimeWeight, getClosestStartDatetime, getClosestEndDatetime} from '../_utils/datetime.js';

/** @typedef {import('cpt2js').Palette} Palette */
/** @typedef {import('../_utils/data').TextureData} TextureData */
/** @typedef {import('../_utils/unit-format').UnitFormat} UnitFormat */
/** @typedef {import('../_utils/stac').StacCatalog} StacCatalog */
/** @typedef {import('../_utils/stac').StacCollection} StacCollection */
/** @typedef {import('../_utils/stac').StacProviderRole} StacProviderRole */
/** @typedef {import('../_utils/stac').StacProvider} StacProvider */
/** @typedef {import('../_utils/stac').StacAssetRole} StacAssetRole */
/** @typedef {import('../_utils/stac').StacItem} StacItem */
/** @typedef {import('./client').ClientConfig} ClientConfig */
/** @typedef {import('./client').Dataset} Dataset */
/** @typedef {import('./client').DatasetData} DatasetData */

const DEFAULT_URL = __CATALOG_URL__;
const DEFAULT_DATA_FORMAT = 'byte.png';

/**
 * @param {StacCollection} stacCollection
 * @param {string | null} attributionLinkClass
 * @returns {string}
 */
function getStacCollectionAttribution(stacCollection, attributionLinkClass = null) {
  const producer = stacCollection.providers.find(x => x.roles.includes(/** @type {StacProviderRole} */('producer')));
  const processor = stacCollection.providers.find(x => x.roles.includes(/** @type {StacProviderRole} */('processor')));
  const attribution = [
    ...(producer ? [`<a href="${producer.url}"${attributionLinkClass ? ` class="${attributionLinkClass}"`: ''}>${producer.name}</a>`] : []),
    ...(processor ? [`<a href="${processor.url}"${attributionLinkClass ? ` class="${attributionLinkClass}"`: ''}>${processor.name}</a>`] : []),
  ].join(' via ');
  return attribution;
}

export class Client {
  /** @type {ClientConfig} */
  config;
  /** @type {Map<string, any>} */
  cache = new Map();

  /**
   * @param {ClientConfig} config
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * @param {ClientConfig} config
   * @returns {void}
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * @param {string} path
   * @param {ClientConfig} [config]
   * @returns {string}
   */
  #getAuthenticatedUrl(path, config = {}) {
    const accessToken = config.accessToken ?? this.config.accessToken ?? null;
    const hindcastDays = config.hindcastDays ?? this.config.hindcastDays ?? null;
    const forecastDays = config.forecastDays ?? this.config.forecastDays ?? null;
    const url = new URL(path);
    if (!url.searchParams.has('access_token') && accessToken != null) {
      url.searchParams.set('access_token', accessToken);
    }
    if (!url.searchParams.has('hindcast_days') && hindcastDays != null) {
      url.searchParams.set('hindcast_days', hindcastDays.toString());
    }
    if (!url.searchParams.has('forecast_days') && forecastDays != null) {
      url.searchParams.set('forecast_days', forecastDays.toString());
    }
    if (!url.searchParams.has('version')) {
      url.searchParams.set('version', VERSION);
    }
    return url.toString();
  }

  /**
   * @param {ClientConfig} [config]
   * @returns {Promise<StacCatalog>}
   */
  async #loadStacCatalog(config = {}) {
    const url = config.url ?? this.config.url ?? DEFAULT_URL;
    const authenticatedUrl = this.#getAuthenticatedUrl(`${url}/catalog`, config);
    return loadJson(authenticatedUrl, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {ClientConfig} [config]
   * @returns {Promise<StacCollection>}
   */
  async #loadStacCollection(dataset, config = {}) {
    const url = config.url ?? this.config.url ?? DEFAULT_URL;
    const authenticatedUrl = this.#getAuthenticatedUrl(`${url}/catalog/${dataset}`, config);
    return loadJson(authenticatedUrl, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {ClientConfig} [config]
   * @returns {Promise<Palette>}
   */
  async #loadStacCollectionPalette(dataset, config = {}) {
    const stacCollection = await this.#loadStacCollection(dataset, config);
    const asset = Object.values(stacCollection.assets).find(x => x.roles.includes(/** @type {StacAssetRole} */('palette')) && x.type === 'text/plain');
    if (!asset) {
      throw new Error(`Palette asset not found`);
    }
    const authenticatedUrl = this.#getAuthenticatedUrl(asset.href, this.config);
    return loadText(authenticatedUrl, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {ClientConfig} [config]
   * @returns {Promise<StacItem>}
   */
  async #loadStacItem(dataset, datetime, config = {}) {
    const stacCollection = await this.#loadStacCollection(dataset, config);
    const link = stacCollection.links.find(x => x.rel === 'item' && x.datetime === datetime);
    if (!link) {
      throw new Error(`Item ${datetime} not found`);
    }
    const authenticatedUrl = this.#getAuthenticatedUrl(link.href, this.config);
    return loadJson(authenticatedUrl, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {ClientConfig} [config]
   * @returns {Promise<TextureData>}
   */
  async #loadStacItemData(dataset, datetime, config = {}) {
    const dataFormat = config.dataFormat ?? this.config.dataFormat ?? DEFAULT_DATA_FORMAT;
    const stacItem = await this.#loadStacItem(dataset, datetime);
    const authenticatedUrl = this.#getAuthenticatedUrl(stacItem.assets[`data.${dataFormat}`].href, this.config);
    return loadTextureData(authenticatedUrl, this.cache);
  }

  /**
   * @param {ClientConfig} [config]
   * @returns {Promise<string[]>}
   */
  async loadCatalog(config = {}) {
    const stacCatalog = await this.#loadStacCatalog(config);
    const modelIds = /** @type {string[]} */ (stacCatalog.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
    const datasetIds = (await Promise.all(modelIds.map(async modelId => {
      const stacCollection = await this.#loadStacCollection(modelId);
      const datasetIds = /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
      return datasetIds;
    }))).flat();
    return datasetIds;
  }

  /**
   * @param {string} dataset
   * @param {ClientConfig} [config]
   * @returns {Promise<Dataset>}
   */
  async loadDataset(dataset, config = {}) {
    const attributionLinkClass = config.attributionLinkClass ?? this.config.attributionLinkClass ?? null;
    const stacCollection = await this.#loadStacCollection(dataset, config);

    return {
      title: stacCollection.title,
      unitFormat: stacCollection['weatherLayers:units'][0],
      attribution: getStacCollectionAttribution(stacCollection, attributionLinkClass),
      datetimes: /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'item').map(x => x.datetime).filter(x => !!x)),
      palette: await this.#loadStacCollectionPalette(dataset)
    };
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {ClientConfig} [config]
   * @returns {Promise<DatasetData>}
   */
  async loadDatasetData(dataset, datetime, config = {}) {
    const datetimeInterpolate = config.datetimeInterpolate ?? this.config.datetimeInterpolate ?? false;
    const stacCollection = await this.#loadStacCollection(dataset, config);
    const datetimes = (await this.loadDataset(dataset, config)).datetimes;
    const startDatetime = getClosestStartDatetime(datetimes, datetime);
    const endDatetime = datetimeInterpolate ? getClosestEndDatetime(datetimes, datetime) : null;

    if (!startDatetime) {
      throw new Error('No data found');
    }

    const [image, image2] = await Promise.all([
      this.#loadStacItemData(dataset, startDatetime, config),
      datetimeInterpolate && endDatetime ? this.#loadStacItemData(dataset, endDatetime, config) : null,
    ]);

    return {
      image,
      image2,
      imageWeight: datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0,
      imageType: stacCollection['weatherLayers:imageType'],
      imageUnscale: image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection['weatherLayers:imageUnscale'] : null,
      bounds: stacCollection.extent.spatial.bbox[0]
    };
  }
}