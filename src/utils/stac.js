/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/** @typedef {import('./stac').StacCatalog} StacCatalog */
/** @typedef {import('./stac').StacCollection} StacCollection */
/** @typedef {import('./stac').StacItem} StacItem */
/** @typedef {import('./stac').StacAsset} StacAsset */

const CACHE = new Map();

/**
 * @template T
 * @param {string} url
 * @return {Promise<T>}
 */
async function loadJson(url) {
  return (await fetch(url)).json();
}

/**
 * @template T
 * @param {string} url
 * @return {Promise<T>}
 */
function loadJsonCached(url) {
  const dataOrDataPromise = CACHE.get(url);
  if (dataOrDataPromise) {
    return dataOrDataPromise;
  }
  
  const dataPromise = loadJson(url);
  CACHE.set(url, dataPromise);
  dataPromise.then(data => {
    CACHE.set(url, data);
  });
  return dataPromise;
}

/**
 * @param {string} catalogUrl
 * @param {string} accessToken
 * @returns {Promise<StacCatalog>}
 */
export async function loadStacCatalog(catalogUrl, accessToken) {
  const url = `${catalogUrl}?access_token=${accessToken}`;
  return loadJsonCached(url);
}

/**
 * @param {StacCatalog} stacCatalog
 * @returns {string[]}
 */
 export function getStacCatalogCollectionIds(stacCatalog) {
  const ids = /** @type {string[]} */ (stacCatalog.links.filter(x => x.rel === 'child').map(x => x.id).filter(x => !!x));
  return ids;
}

/**
 * @param {StacCatalog} stacCatalog
 * @param {string} stacCollectionId
 * @returns {Promise<StacCollection>}
 */
export async function loadStacCollection(stacCatalog, stacCollectionId) {
  const link = stacCatalog.links.find(x => x.id === stacCollectionId);
  if (!link) {
    throw new Error(`STAC collection ${stacCollectionId} not found`);
  }
  return loadJsonCached(link.href);
}

/**
 * @param {StacCollection} stacCollection
 * @param {string} datetime
 * @returns {Promise<StacItem>}
 */
export async function loadStacItemByDatetime(stacCollection, datetime) {
  const link = stacCollection.links.find(x => x.rel === 'item' && x.datetime === datetime);
  if (!link) {
    throw new Error(`STAC item ${datetime} not found`);
  }
  return loadJsonCached(link.href);
}

/**
 * @param {StacCollection} stacCollection
 * @returns {string[]}
 */
 export function getStacCollectionDatetimes(stacCollection) {
  const datetimes = /** @type {string[]} */ (stacCollection.links.filter(x => x.rel === 'item').map(x => x.datetime).filter(x => !!x));
  return datetimes;
}

/**
 * @param {StacCollection} stacCollection
 * @returns {string}
 */
export function getStacCollectionAttribution(stacCollection) {
  const stacProvider = stacCollection.providers.find(x => x.roles.includes('producer'));
  if (!stacProvider) {
    throw new Error(`STAC collection attribution not found`);
  }
  const attribution = `<a href="${stacProvider.url}">${stacProvider.name}</a>`;
  return attribution;
}

/**
 * @param {StacItem} stacItem
 * @param {string} stacAssetId
 * @returns {string}
 */
export function getStacItemAssetUrl(stacItem, stacAssetId) {
  const asset = stacItem.assets[stacAssetId];
  if (!asset) {
    throw new Error(`STAC item asset ${stacAssetId} not found`);
  }
  return asset.href;
}