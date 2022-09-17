import { ImageType } from './image-type';
import { UnitFormat } from './unit-format';

export enum StacProviderRole {
  LICENSOR = 'licensor',
  PRODUCER = 'producer',
  PROCESSOR = 'processor',
  HOST = 'host',
}

export interface StacProvider {
  name: string;
  roles: StacProviderRole[];
  url: string;
}

export enum StacLinkRel {
  SELF = 'self',
  ROOT = 'root',
  PARENT = 'parent',
  CHILD = 'child',
  ITEM = 'item',
  LICENSE = 'license',
}

export interface StacLink {
  href: string;
  rel: StacLinkRel;
  type: string;
  id?: string; // custom
  datetime?: string; // custom
}

export interface StacRasterBand {
  data_type: string;
  unit: string;
  scale?: number;
  offset?: number;
}

export enum StacAssetRole {
  DATA = 'data',
  OVERVIEW = 'overview',
  PALETTE = 'palette',
}

export interface StacAsset {
  href: string;
  type: string;
  roles: StacAssetRole[];
  'proj:epsg'?: number;
  'raster:bands'?: StacRasterBand[];
}

export interface StacCatalog {
  type: 'Catalog';
  stac_version: '1.0.0';
  stac_extensions?: string[];
  id: string;
  title: string;
  links: StacLink[];
}

export interface StacCollection {
  type: 'Collection';
  stac_version: '1.0.0';
  stac_extensions?: string[];
  id: string;
  title: string;
  providers: StacProvider[];
  extent: {
    spatial: {
      bbox: [[number, number, number, number]];
    };
    temporal: {
      interval: [[string, string]];
    };
  };
  links: StacLink[];
  assets: { [key: string]: StacAsset };
  'weatherLayers:imageType': ImageType; // custom
  'weatherLayers:imageUnscale': [number, number]; // custom
  'weatherLayers:units': UnitFormat[]; // custom
}

export interface StacItem {
  type: 'Feature';
  stac_version: '1.0.0';
  stac_extensions?: string[];
  id: string;
  geometry: {
    type: 'Polygon',
    coordinates: [[[number, number], [number, number], [number, number], [number, number], [number, number]]];
  };
  bbox: [number, number, number, number];
  properties: {
    datetime: string;
  };
  links: StacLink[];
  assets: { [key: string]: StacAsset };
  collection: string;
}