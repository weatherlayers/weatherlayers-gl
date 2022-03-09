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
  CHILD_LEAF = 'childLeaf', // custom, visible in demo, hidden in browser
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

export interface StacCollectionUnit {
  name: string;
  offset?: number;
  scale?: number;
  decimals?: number;
}

export interface StacCollectionRasterConfig {
  colormapBreaks: [number, string | [number, number, number] | GeoJSON.BBox][];
}

export interface StacCollectionIsolineConfig {
  delta: number;
}

export interface StacCollectionHighLowConfig {
  radius: number;
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
      bbox: GeoJSON.BBox;
    };
    temporal: {
      interval: [[string, string]];
    };
  };
  summaries: {
    imageType: StacCollectionImageType; // custom
    imageBounds: [number, number]; // custom
    unit: StacCollectionUnit[]; // custom
    raster?: StacCollectionRasterConfig; // custom
    contour?: StacCollectionIsolineConfig; // custom
    highLow?: StacCollectionHighLowConfig; // custom
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
  bbox: GeoJSON.BBox;
  properties: {
    datetime: string;
  };
  links: StacLink[];
  assets: { [key: string]: StacAsset };
  collection: string;
}