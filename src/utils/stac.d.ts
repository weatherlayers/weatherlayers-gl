export enum StacProviderRole {
  PRODUCER = 'producer',
  LICENSOR = 'licensor',
  PROCESSOR = 'processor',
  HOST = 'host',
}

export interface StacProvider {
  name: string;
  roles: StacProviderRole[];
  url: string;
}

export interface StacLink {
  rel: string;
  type: string;
  id: string;
  href: string;
}

export enum StacAssetRole {
  DATA = 'data',
}

export interface StacAsset {
  roles: StacAssetRole[];
  type: string;
  href: string;
}

export interface StacCatalog {
  stac_version: '1.0.0';
  type: 'Catalog';
  id: string;
  title: string;
  links: StacLink[];
}

export interface StacCollection {
  stac_version: '1.0.0';
  type: 'Collection';
  id: string;
  title: string;
  providers: StacProvider[];
  extent: {
    spatial: { bbox: [number, number, number, number] };
    temporal: [[string, string]];
  };
  links: StacLink[];
}

export interface StacItem {
  stac_version: '1.0.0';
  type: 'Feature';
  id: string;
  bbox: [number, number, number, number];
  properties: {
    title: string;
    license: string;
    providers: StacProvider[];
    datetime: string;
  }
  assets: { [key: string]: StacAsset };
}