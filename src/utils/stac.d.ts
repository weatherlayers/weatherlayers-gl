/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
  type: 'Catalog';
  stac_version: '1.0.0';
  id: string;
  title: string;
  links: StacLink[];
}

export interface StacCollection {
  type: 'Collection';
  stac_version: '1.0.0';
  id: string;
  title: string;
  providers: StacProvider[];
  extent: {
    spatial: { bbox: [number, number, number, number] };
    temporal: [[string, string]];
  };
  summaries: {
    vectorValue?: { minimum: number, maximum: number };
    value: { minimum: number, maximum: number };
    unit: { name: string, offset?: number, scale?: number, decimals?: number }[];
  },
  links: StacLink[];
}

export interface StacItem {
  type: 'Feature';
  stac_version: '1.0.0';
  id: string;
  geometry: { type: 'Polygon', coordinates: [[[number, number], [number, number], [number, number], [number, number], [number, number]]] }
  bbox: [number, number, number, number];
  properties: {
    datetime: string;
  }
  assets: { [key: string]: StacAsset };
} 