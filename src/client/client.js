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
/** @typedef {import('./client').LoadDatasetOptions} LoadDatasetOptions */
/** @typedef {import('./client').Dataset} Dataset */
/** @typedef {import('./client').LoadDatasetDataOptions} LoadDatasetDataOptions */
/** @typedef {import('./client').DatasetData} DatasetData */

/** @type {ClientConfig} */
const DEFAULT_CONFIG = {
  url: 'https://catalog.weatherlayers.com',
  // url: 'http://localhost:8080',
  dataFormat: 'byte.png',
};

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
 * @param {string} [attributionLinkClass]
 * @returns {string}
 */
function getStacCollectionAttribution(stacCollection, attributionLinkClass = undefined) {
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
   * @param {Partial<ClientConfig>} config
   */
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * @param {Partial<ClientConfig>} config
   * @returns {void}
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * @returns {Promise<StacCatalog>}
   */
  async loadStacCatalog() {
    const authenticatedUrl = getAuthenticatedUrl(`${this.config.url}/catalog`, this.config.accessToken);
    return loadJson(authenticatedUrl, this.cache);
  }

  /**
   * @param {string} dataset
   * @returns {Promise<StacCollection>}
   */
  async loadStacCollection(dataset) {
    const authenticatedUrl = getAuthenticatedUrl(`${this.config.url}/catalog/${dataset}`, this.config.accessToken);
    return loadJson(authenticatedUrl, this.cache);
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
    const authenticatedUrl = getAuthenticatedUrl(asset.href, this.config.accessToken);
    return loadText(authenticatedUrl, this.cache);
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
    const authenticatedUrl = getAuthenticatedUrl(link.href, this.config.accessToken);
    return loadJson(authenticatedUrl, this.cache);
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {string} dataFormat
   * @returns {Promise<TextureData>}
   */
  async loadStacItemData(dataset, datetime, dataFormat) {
    const stacItem = await this.loadStacItem(dataset, datetime);
    const authenticatedUrl = getAuthenticatedUrl(stacItem.assets[`data.${dataFormat}`].href, this.config.accessToken);
    return loadTextureData(authenticatedUrl, this.cache);
  }

  /**
   * @returns {Promise<string[]>}
   */
  async loadCatalog() {
    const stacCatalog = await this.loadStacCatalog();
    const modelIds = /** @type {string[]} */ (stacCatalog.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
    const datasetIds = (await Promise.all(modelIds.map(async modelId => {
      const stacCollection = await this.loadStacCollection(modelId);
      const datasetIds = /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
      return datasetIds;
    }))).flat();
    return datasetIds;
  }

  /**
   * @param {string} dataset
   * @param {LoadDatasetOptions} options
   * @returns {Promise<Dataset>}
   */
  async loadDataset(dataset, {attributionLinkClass} = {}) {
    const stacCollection = await this.loadStacCollection(dataset);

    return {
      title: stacCollection.title,
      unitFormat: stacCollection['weatherLayers:units'][0],
      attribution: getStacCollectionAttribution(stacCollection, attributionLinkClass),
      datetimes: /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'item').map(x => x.datetime).filter(x => !!x)),
      palette: await this.loadStacCollectionPalette(dataset)
    };
  }

  /**
   * @param {string} dataset
   * @param {string} datetime
   * @param {LoadDatasetDataOptions} options
   * @returns {Promise<DatasetData>}
   */
  async loadDatasetData(dataset, datetime, {datetimeInterpolate = false} = {}) {
    const stacCollection = await this.loadStacCollection(dataset);
    const datetimes = (await this.loadDataset(dataset)).datetimes;
    const startDatetime = getClosestStartDatetime(datetimes, datetime);
    const endDatetime = datetimeInterpolate ? getClosestEndDatetime(datetimes, datetime) : null;

    if (!startDatetime) {
      throw new Error('No data found');
    }

    const [image, image2] = await Promise.all([
      this.loadStacItemData(dataset, startDatetime, this.config.dataFormat),
      datetimeInterpolate && endDatetime ? this.loadStacItemData(dataset, endDatetime, this.config.dataFormat) : null,
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