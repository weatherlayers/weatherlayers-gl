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

export enum StacAssetRole {
  DATA = 'data',
}

export interface StacAsset {
  href: string;
  type: string;
  roles: StacAssetRole[];
}

export interface StacCatalog {
  type: 'Catalog';
  stac_version: '1.0.0';
  id: string;
  title: string;
  links: StacLink[];
}

export interface StacCollectionRasterConfig {
  colormapBreaks: [number, string | [number, number, number] | [number, number, number, number]][];
}

export interface StacCollectionContourConfig {
  step: number;
}

export interface StacCollectionParticleConfig {
  maxAge: number;
  speedFactor: number;
  width: number;
}

export enum StacCollectionImageType {
  SCALAR = 0,
  VECTOR = 1,
}

export interface StacCollection {
  type: 'Collection';
  stac_version: '1.0.0';
  id: string;
  title: string;
  providers: StacProvider[];
  extent: {
    spatial: {
      bbox: [number, number, number, number];
    };
    temporal: {
      interval: [[string, string]];
    };
  };
  summaries: {
    imageType: StacCollectionImageType; // custom
    imageBounds: [number, number]; // custom
    unit: { name: string, offset?: number, scale?: number, decimals?: number }[]; // custom
    raster?: StacCollectionRasterConfig; // custom
    contour?: StacCollectionContourConfig; // custom
    particle?: StacCollectionParticleConfig; // custom
  },
  links: StacLink[];
}

export interface StacItem {
  type: 'Feature';
  stac_version: '1.0.0';
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