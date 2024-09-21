import type { ImageType } from './image-type.js';
import type { UnitDefinition } from './unit-definition.js';

export const StacProviderRole = {
  LICENSOR: 'licensor',
  PRODUCER: 'producer',
  PROCESSOR: 'processor',
  HOST: 'host',
} as const;

export type StacProviderRole = (typeof StacProviderRole)[keyof typeof StacProviderRole];

export interface StacProvider {
  name: string;
  roles: StacProviderRole[];
  url: string;
}

export const StacLinkRel = {
  LICENSE: 'license',
  SELF: 'self',
  ROOT: 'root',
  PARENT: 'parent',
  CHILD: 'child',
  ITEM: 'item',
  COLLECTION: 'collection',
  CONFORMANCE: 'conformance',
  DATA: 'data',
  SEARCH: 'search',
} as const;

export type StacLinkRel = (typeof StacLinkRel)[keyof typeof StacLinkRel];

export interface StacLink {
  href: string;
  rel: StacLinkRel;
  type: string;
  datetime?: string; // deprecated, used by Virtual Gaia and WatchDuty
}

export const StacAssetRole = {
  DATA: 'data',
  OVERVIEW: 'overview',
  THUMBNAIL: 'thumbnail',
  PALETTE: 'palette',
} as const;

export type StacAssetRole = (typeof StacAssetRole)[keyof typeof StacAssetRole];

export interface StacAsset {
  href: string;
  type: string;
  roles: StacAssetRole[];
}

export interface StacCatalog {
  type: 'Catalog';
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  title: string;
  description: string;
  conformsTo?: string[];
  links: StacLink[];
  stac_browser: {
    crossOriginMedia: string;
    apiCatalogPriority: string;
  };
}

export interface StacCollections<StacCollectionT extends StacCollection = StacCollection> {
  collections: StacCollectionT[];
  links: StacLink[];
}

export interface StacCollection {
  type: 'Collection';
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  title: string;
  description: string;
  providers: StacProvider[];
  license: string;
  extent: {
    spatial: {
      bbox: [[number, number, number, number]];
    };
    temporal: {
      interval: [[string | null, string | null]];
    };
  };
  summaries?: unknown; // deprecated, used by Virtual Gaia
  links: StacLink[];
  assets: { [key: string]: StacAsset };
}

export interface StacItemCollection<StacItemT extends StacItem = StacItem> {
  type: 'FeatureCollection';
  features: StacItemT[];
  links: StacLink[];
}

export interface StacItem<ExtraPropertiesT extends {} = {}, StacAssetT extends StacAsset = StacAsset> {
  type: 'Feature';
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  geometry: {
    type: 'Polygon',
    coordinates: [[[number, number], [number, number], [number, number], [number, number], [number, number]]];
  };
  bbox: [number, number, number, number];
  properties: {
    datetime: string;
  } & ExtraPropertiesT;
  links: StacLink[];
  assets: { [key: string]: StacAssetT };
  collection: string;
}

export type DatasetStacCollections = StacCollections<DatasetStacCollection>;

export interface DatasetStacCollection extends StacCollection {
  'weatherLayers:imageType': ImageType; // custom
  'weatherLayers:imageUnscale': [number, number] | null; // custom
  'weatherLayers:units': UnitDefinition[]; // custom
}

export type DatasetDataStacItemCollection = StacItemCollection<DatasetDataStacItem>;

export type DatasetDataStacItem = StacItem<{
  'forecast:reference_datetime': string;
  'forecast:horizon': string;
}, DatasetDataStacAsset>;

export interface DatasetDataStacAsset extends StacAsset {
  'proj:code': string;
  'proj:shape': [number, number];
  'raster:bands'?: {
    data_type: string;
    unit: string;
    scale?: number;
    offset?: number;
  }[];
}