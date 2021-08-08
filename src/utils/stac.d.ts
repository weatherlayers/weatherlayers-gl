export interface StacLink {
  rel: string;
  type: string;
  id: string;
  href: string;
}

export enum StacRole {
  DATA = 'data',
}

export interface StacAsset {
  roles: StacRole[];
  type: string;
  href: string;
}

export interface StacCatalog {
  stac_version: '1.0.0';
  type: 'Catalog';
  id: string;
  links: StacLink[];
}

export interface StacCollection {
  stac_version: '1.0.0';
  type: 'Collection';
  id: string;
  links: StacLink[];
}

export interface StacItem {
  stac_version: '1.0.0';
  type: 'Feature';
  id: string;
  assets: { [key: string]: StacAsset };
}