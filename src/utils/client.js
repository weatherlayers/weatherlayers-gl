/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/** @typedef {import('./client').ClientConfig} ClientConfig */

/** @type {ClientConfig} */
const DEFAULT_CLIENT_CONFIG = {
  url: 'https://api.weatherlayers.com/catalog',
  // url: 'http://localhost:8080/catalog',
  format: 'byte.png',
};

/** @type {ClientConfig} */
let clientConfig = DEFAULT_CLIENT_CONFIG;

/**
 * @param {Partial<ClientConfig>} config
 */
export function setClientConfig(config) {
  clientConfig = { ...DEFAULT_CLIENT_CONFIG, ...config };
}

/**
 * @returns {ClientConfig}
 */
export function getClientConfig() {
  return clientConfig;
}