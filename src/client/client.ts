import { Palette } from 'cpt2js';
import { VERSION, CATALOG_URL } from '../_utils/build.js';
import { TextureData, loadTextureData, loadJson } from '../_utils/data.js';
import { getDatetimeWeight, getClosestStartDatetime, getClosestEndDatetime } from '../_utils/datetime.js';
import type { DatetimeISOString, DatetimeISOStringRange } from '../_utils/datetime.js';
import type { ImageType } from '../_utils/image-type.js';
import type { ImageUnscale } from '../_utils/image-unscale.js';
import type { UnitFormat } from '../_utils/unit-format.js';
import { StacProviderRole, StacAssetRole, StacLinkRel } from '../_utils/stac.js';
import type { StacCatalog, DatasetStacCollections, DatasetStacCollection, DatasetDataStacItemCollection, DatasetDataStacItem } from '../_utils/stac.js';

export interface ClientConfig {
  url?: string;
  accessToken?: string;
  dataFormat?: string;
  attributionLinkClass?: string;
  datetimeInterpolate?: boolean;
}

export interface Dataset {
  title: string;
  unitFormat: UnitFormat;
  attribution: string;
  datetimeRange: DatetimeISOStringRange;
  datetimes: DatetimeISOString[]; // deprecated, use `loadDatasetSlice` instead
  palette: Palette;
}

export interface DatasetSlice {
  datetimes: DatetimeISOString[];
}

export interface DatasetData {
  image: TextureData;
  image2: TextureData | null; // applicable only if `datetimeInterpolate` is enabled
  imageWeight: number; // applicable only if `datetimeInterpolate` is enabled
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  bounds: [number, number, number, number];
}

const DEFAULT_URL = CATALOG_URL;
const DEFAULT_DATA_FORMAT = 'byte.png';

function getStacCollectionAttribution(stacCollection: DatasetStacCollection, attributionLinkClass: string | null = null): string {
  const producer = stacCollection.providers.find(x => x.roles.includes(StacProviderRole.PRODUCER));
  const processor = stacCollection.providers.find(x => x.roles.includes(StacProviderRole.PROCESSOR));
  const attribution = [
    ...(producer ? [`<a href="${producer.url}"${attributionLinkClass ? ` class="${attributionLinkClass}"`: ''}>${producer.name}</a>`] : []),
    ...(processor ? [`<a href="${processor.url}"${attributionLinkClass ? ` class="${attributionLinkClass}"`: ''}>${processor.name}</a>`] : []),
  ].join(' via ');
  return attribution;
}

function serializeDatetimeISOStringRange(datetimeRange: DatetimeISOStringRange): string {
  const [start, end] = datetimeRange;
  return `${start ?? '..'}/${end ?? '..'}`;
}

export class Client {
  #config: ClientConfig;
  #cache = new Map<string, any>();
  #datasetStacCollectionCache = new Map<string, DatasetStacCollection>();
  #datasetDataStacItemCache = new Map<string, Map<DatetimeISOString, DatasetDataStacItem>>();

  constructor(config: ClientConfig) {
    this.#config = config;
  }

  getConfig(): ClientConfig {
    return { ...this.#config };
  }

  setConfig(config: ClientConfig): void {
    this.#config = config;
  }

  updateConfig(config: Partial<ClientConfig>): void {
    this.setConfig({ ...this.#config, ...config });
  }

  #getAuthenticatedUrl(path: string, config: ClientConfig = {}): string {
    const accessToken = config.accessToken ?? this.#config.accessToken ?? null;
    const url = new URL(path);
    if (!url.searchParams.has('access_token') && accessToken != null) {
      url.searchParams.set('access_token', accessToken);
    }
    if (!url.searchParams.has('version')) {
      url.searchParams.set('version', VERSION);
    }
    return url.toString();
  }

  #cacheDatasetStacCollection(stacCollection: DatasetStacCollection): void {
    this.#datasetStacCollectionCache.set(stacCollection.id, stacCollection);
  }

  #cacheDatasetDataStacItem(dataset: string, stacItem: DatasetDataStacItem): void {
    if (!this.#datasetDataStacItemCache.has(dataset)) {
      this.#datasetDataStacItemCache.set(dataset, new Map());
    }
    this.#datasetDataStacItemCache.get(dataset)!.set(stacItem.properties.datetime, stacItem);
  }

  async #loadStacCatalog(config: ClientConfig = {}): Promise<StacCatalog> {
    const url = config.url ?? this.#config.url ?? DEFAULT_URL;
    const authenticatedUrl = this.#getAuthenticatedUrl(`${url}/catalog`, config);
    const stacCatalog = await loadJson(authenticatedUrl, this.#cache) as StacCatalog;

    return stacCatalog;
  }

  async #loadDatasetStacCollections(config: ClientConfig = {}): Promise<DatasetStacCollection[]> {
    const stacCatalog = await this.#loadStacCatalog(config);
    const link = stacCatalog.links.find(x => x.rel === StacLinkRel.DATA);
    if (!link) {
      throw new Error('STAC Catalog data link not found');
    }

    const authenticatedUrl = this.#getAuthenticatedUrl(link.href, config);
    const stacCollections = (await loadJson(authenticatedUrl, this.#cache) as DatasetStacCollections).collections;

    // cache
    for (const stacCollection of stacCollections) {
      this.#cacheDatasetStacCollection(stacCollection);
    }

    return stacCollections;
  }

  async #loadDatasetStacCollection(dataset: string, config: ClientConfig = {}): Promise<DatasetStacCollection> {
    await this.#loadDatasetStacCollections(config);
    let stacCollection = this.#datasetStacCollectionCache.get(dataset);
    if (!stacCollection) {
      throw new Error(`STAC Collection ${dataset} not found`);
    }

    // cache
    this.#cacheDatasetStacCollection(stacCollection);

    return stacCollection;
  }

  async #loadDatasetStacCollectionPalette(dataset: string, config: ClientConfig = {}): Promise<Palette> {
    const stacCollection = await this.#loadDatasetStacCollection(dataset, config);
    const asset = Object.values(stacCollection.assets).find(x => x.roles.includes(StacAssetRole.PALETTE) && x.type === 'application/json');
    if (!asset) {
      throw new Error(`STAC Collection ${dataset} palette asset not found`);
    }

    const authenticatedUrl = this.#getAuthenticatedUrl(asset.href, this.#config);
    const palette = await loadJson(authenticatedUrl, this.#cache) as Palette;

    return palette;
  }

  async #searchDatasetDataStacItems(dataset: string, datetimeRange: DatetimeISOStringRange, config: ClientConfig = {}): Promise<DatasetDataStacItem[]> {
    const stacCatalog = await this.#loadStacCatalog(config);
    const link = stacCatalog.links.find(x => x.rel === StacLinkRel.SEARCH);
    if (!link) {
      throw new Error('STAC Catalog search link not found');
    }

    const url = new URL(link.href);
    url.searchParams.set('collections', dataset);
    url.searchParams.set('datetime', serializeDatetimeISOStringRange(datetimeRange));
    const authenticatedUrl = this.#getAuthenticatedUrl(url.toString(), config);
    const stacItems = (await loadJson(authenticatedUrl, this.#cache) as DatasetDataStacItemCollection).features;

    // cache
    for (const stacItem of stacItems) {
      this.#cacheDatasetDataStacItem(dataset, stacItem);
    }

    return stacItems;
  }

  async #loadDatasetDataStacItem(dataset: string, datetime: DatetimeISOString, config: ClientConfig = {}): Promise<DatasetDataStacItem> {
    let stacItem = this.#datasetDataStacItemCache.get(dataset)?.get(datetime);
    if (!stacItem) {
      const stacItems = await this.#searchDatasetDataStacItems(dataset, [datetime, datetime], config);
      stacItem = stacItems[0];
    }
    if (!stacItem) {
      throw new Error(`STAC Item ${dataset}/${datetime} not found`);
    }

    this.#cacheDatasetDataStacItem(dataset, stacItem);

    return stacItem;
  }

  async #loadDatasetDataStacItemData(dataset: string, datetime: DatetimeISOString, config: ClientConfig = {}): Promise<TextureData> {
    const dataFormat = config.dataFormat ?? this.#config.dataFormat ?? DEFAULT_DATA_FORMAT;
    const stacItem = await this.#loadDatasetDataStacItem(dataset, datetime);
    const asset = stacItem.assets[`data.${dataFormat}`];
    if (!asset) {
      throw new Error(`STAC Item ${dataset}/${datetime} data asset not found`);
    }

    const authenticatedUrl = this.#getAuthenticatedUrl(asset.href, this.#config);
    return loadTextureData(authenticatedUrl, this.#cache);
  }

  async loadCatalog(config: ClientConfig = {}): Promise<string[]> {
    const stacCollections = await this.#loadDatasetStacCollections(config);
    const datasetIds = stacCollections.map(stacCollection => stacCollection.id);
    return datasetIds;
  }

  async loadDataset(dataset: string, config: ClientConfig = {}): Promise<Dataset> {
    const attributionLinkClass = config.attributionLinkClass ?? this.#config.attributionLinkClass ?? null;
    const stacCollection = await this.#loadDatasetStacCollection(dataset, config);

    return {
      title: stacCollection.title,
      unitFormat: stacCollection['weatherLayers:units'][0],
      attribution: getStacCollectionAttribution(stacCollection, attributionLinkClass),
      datetimeRange: stacCollection.extent.temporal.interval[0],
      datetimes: stacCollection.links.filter(x => x.rel === StacLinkRel.ITEM).map(x => x.datetime).filter(x => !!x) as DatetimeISOString[],
      palette: await this.#loadDatasetStacCollectionPalette(dataset),
    };
  }

  async loadDatasetSlice(dataset: string, datetimeRange: DatetimeISOStringRange, config: ClientConfig = {}): Promise<DatasetSlice> {
    const stacItems = await this.#searchDatasetDataStacItems(dataset, datetimeRange, config);
    const datetimes = stacItems.map(x => x.properties.datetime);

    return { datetimes };
  }

  async loadDatasetData(dataset: string, datetime: DatetimeISOString, config: ClientConfig = {}): Promise<DatasetData> {
    const datetimeInterpolate = config.datetimeInterpolate ?? this.#config.datetimeInterpolate ?? false;
    const stacCollection = await this.#loadDatasetStacCollection(dataset, config);
    const datetimes = Array.from(this.#datasetDataStacItemCache.get(dataset)?.values() ?? []).map(x => x.properties.datetime).sort();
    let startDatetime, endDatetime;
    if (datetimes.length > 0) {
      startDatetime = getClosestStartDatetime(datetimes, datetime);
      endDatetime = datetimeInterpolate ? getClosestEndDatetime(datetimes, datetime) : null;
    } else {
      startDatetime = datetime;
      endDatetime = null;
    }

    if (!startDatetime) {
      throw new Error('No data found');
    }

    const [image, image2] = await Promise.all([
      this.#loadDatasetDataStacItemData(dataset, startDatetime, config),
      datetimeInterpolate && endDatetime ? this.#loadDatasetDataStacItemData(dataset, endDatetime, config) : null,
    ]);

    return {
      image,
      image2,
      imageWeight: datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0,
      imageType: stacCollection['weatherLayers:imageType'],
      imageUnscale: image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection['weatherLayers:imageUnscale'] : null,
      bounds: stacCollection.extent.spatial.bbox[0],
    };
  }
}