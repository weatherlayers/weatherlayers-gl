import type {ImageType} from './image-type.js';
import type {UnitDefinition} from './unit-definition.js';

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
  title?: string;
  datetime?: string; // deprecated, used by Virtual Gaia and WatchDuty
}

export const StacAssetRole = {
  DATA: 'data',
  OVERVIEW: 'overview',
  THUMBNAIL: 'thumbnail',
  PALETTE: 'palette',
} as const;

export type StacAssetRole = (typeof StacAssetRole)[keyof typeof StacAssetRole];

export interface StacCollectionItemAsset {
  type: string;
  roles: StacAssetRole[];
  data_type?: string;
  unit?: string;
  'proj:code'?: string;
  'proj:shape'?: [number, number];
  'raster:scale'?: number;
  'raster:offset'?: number;
}

export interface StacAsset extends StacCollectionItemAsset {
  href: string;
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

export interface StacCollections {
  collections: StacCollection[];
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
  assets?: {[key: string]: StacAsset};
  item_assets?: {[key: string]: StacCollectionItemAsset};
  'weatherLayers:imageType'?: ImageType; // used by WeatherLayers Cloud Client
  'weatherLayers:imageUnscale'?: [number, number] | null; // used by WeatherLayers Cloud Client
  'weatherLayers:units'?: UnitDefinition[]; // used by WeatherLayers Cloud Client
}

export interface StacItemCollection {
  type: 'FeatureCollection';
  features: StacItem[];
  links: StacLink[];
}

export interface StacItem {
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
    'forecast:reference_datetime'?: string; // used by WeatherLayers Cloud Client
    'forecast:horizon'?: string; // used by WeatherLayers Cloud Client
  };
  links: StacLink[];
  assets: {[key: string]: StacAsset};
  collection: string;
}