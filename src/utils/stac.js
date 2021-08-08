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
async function loadData(url) {
  if (CACHE.has(url)) {
    return CACHE.get(url);
  }
  
  const data = await (await fetch(url)).json();
  CACHE.set(url, data);
  return data;
}

/**
 * @param {string} catalogUrl
 * @param {string} accessToken
 * @returns {Promise<StacCatalog>}
 */
export async function loadStacCatalog(catalogUrl, accessToken) {
  const url = `${catalogUrl}?access_token=${accessToken}`;
  return loadData(url);
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
  return loadData(link.href);
}

/**
 * @param {StacCollection} stacCollection
 * @param {string} stacItemId
 * @returns {Promise<StacItem>}
 */
export async function loadStacItem(stacCollection, stacItemId) {
  const link = stacCollection.links.find(x => x.id === stacItemId);
  if (!link) {
    throw new Error(`STAC item ${stacItemId} not found`);
  }
  return loadData(link.href);
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