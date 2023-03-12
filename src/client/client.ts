import {Palette} from 'cpt2js';
import {VERSION, CATALOG_URL} from '../_utils/build.js';
import {TextureData, loadTextureData, loadJson, loadText} from '../_utils/data.js';
import type {ImageType} from '../_utils/image-type.js';
import type {UnitFormat} from '../_utils/unit-format.js';
import {StacCatalog, StacCollection, StacProviderRole, StacAssetRole, StacItem} from '../_utils/stac.js';
import {getDatetimeWeight, getClosestStartDatetime, getClosestEndDatetime} from '../_utils/datetime.js';

export interface ClientConfig {
  url?: string;
  accessToken?: string;
  dataFormat?: string;
  hindcastDays?: number;
  forecastDays?: number;
  attributionLinkClass?: string;
  datetimeInterpolate?: boolean;
}

export interface Dataset {
  title: string;
  unitFormat: UnitFormat;
  attribution: string;
  datetimes: string[];
  palette: Palette;
}

export interface DatasetData {
  image: TextureData;
  image2: TextureData | null; // applicable only if datetimeInterpolate is enabled
  imageWeight: number; // applicable only if datetimeInterpolate is enabled
  imageType: ImageType;
  imageUnscale: [number, number] | null;
  bounds: [number, number, number, number];
}

const DEFAULT_URL = CATALOG_URL;
const DEFAULT_DATA_FORMAT = 'byte.png';

function getStacCollectionAttribution(stacCollection: StacCollection, attributionLinkClass: string | null = null): string {
  const producer = stacCollection.providers.find(x => x.roles.includes(StacProviderRole.PRODUCER));
  const processor = stacCollection.providers.find(x => x.roles.includes(StacProviderRole.PROCESSOR));
  const attribution = [
    ...(producer ? [`<a href="${producer.url}"${attributionLinkClass ? ` class="${attributionLinkClass}"`: ''}>${producer.name}</a>`] : []),
    ...(processor ? [`<a href="${processor.url}"${attributionLinkClass ? ` class="${attributionLinkClass}"`: ''}>${processor.name}</a>`] : []),
  ].join(' via ');
  return attribution;
}

export class Client {
  config: ClientConfig;
  cache = new Map<string, any>();

  constructor(config: ClientConfig) {
    this.config = config;
  }

  setConfig(config: ClientConfig): void {
    this.config = { ...this.config, ...config };
  }

  #getAuthenticatedUrl(path: string, config: ClientConfig = {}): string {
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

  async #loadStacCatalog(config: ClientConfig = {}): Promise<StacCatalog> {
    const url = config.url ?? this.config.url ?? DEFAULT_URL;
    const authenticatedUrl = this.#getAuthenticatedUrl(`${url}/catalog`, config);
    return loadJson(authenticatedUrl, this.cache);
  }

  async #loadStacCollection(dataset: string, config: ClientConfig = {}): Promise<StacCollection> {
    const url = config.url ?? this.config.url ?? DEFAULT_URL;
    const authenticatedUrl = this.#getAuthenticatedUrl(`${url}/catalog/${dataset}`, config);
    return loadJson(authenticatedUrl, this.cache);
  }

  async #loadStacCollectionPalette(dataset: string, config: ClientConfig = {}): Promise<Palette> {
    const stacCollection = await this.#loadStacCollection(dataset, config);
    const asset = Object.values(stacCollection.assets).find(x => x.roles.includes(StacAssetRole.PALETTE) && x.type === 'text/plain');
    if (!asset) {
      throw new Error(`Palette asset not found`);
    }
    const authenticatedUrl = this.#getAuthenticatedUrl(asset.href, this.config);
    return loadText(authenticatedUrl, this.cache);
  }

  async #loadStacItem(dataset: string, datetime: string, config: ClientConfig = {}): Promise<StacItem> {
    const stacCollection = await this.#loadStacCollection(dataset, config);
    const link = stacCollection.links.find(x => x.rel === 'item' && x.datetime === datetime);
    if (!link) {
      throw new Error(`Item ${datetime} not found`);
    }
    const authenticatedUrl = this.#getAuthenticatedUrl(link.href, this.config);
    return loadJson(authenticatedUrl, this.cache);
  }

  async #loadStacItemData(dataset: string, datetime: string, config: ClientConfig = {}): Promise<TextureData> {
    const dataFormat = config.dataFormat ?? this.config.dataFormat ?? DEFAULT_DATA_FORMAT;
    const stacItem = await this.#loadStacItem(dataset, datetime);
    const authenticatedUrl = this.#getAuthenticatedUrl(stacItem.assets[`data.${dataFormat}`].href, this.config);
    return loadTextureData(authenticatedUrl, this.cache);
  }

  async loadCatalog(config: ClientConfig = {}): Promise<string[]> {
    const stacCatalog = await this.#loadStacCatalog(config);
    const modelIds = stacCatalog.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x) as string[];
    const datasetIds = (await Promise.all(modelIds.map(async modelId => {
      const stacCollection = await this.#loadStacCollection(modelId);
      const datasetIds = stacCollection.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x) as string[];
      return datasetIds;
    }))).flat();
    return datasetIds;
  }

  async loadDataset(dataset: string, config: ClientConfig = {}): Promise<Dataset> {
    const attributionLinkClass = config.attributionLinkClass ?? this.config.attributionLinkClass ?? null;
    const stacCollection = await this.#loadStacCollection(dataset, config);

    return {
      title: stacCollection.title,
      unitFormat: stacCollection['weatherLayers:units'][0],
      attribution: getStacCollectionAttribution(stacCollection, attributionLinkClass),
      datetimes: stacCollection.links.filter(x => x.rel === 'item').map(x => x.datetime).filter(x => !!x) as string[],
      palette: await this.#loadStacCollectionPalette(dataset)
    };
  }

  async loadDatasetData(dataset: string, datetime: string, config: ClientConfig = {}): Promise<DatasetData> {
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