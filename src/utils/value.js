/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {number} value
 * @param {{ offset?: number, scale?: number, decimals?: number }} options
 * @returns {number}
 */
export function formatValue(value, { offset = 0, scale = 1, decimals = 0 } = {}) {
  const formattedValue = (value + offset) * scale;
  const roundedFormattedValue = decimals ? Math.round(formattedValue * 10 ** decimals) / 10 ** decimals : Math.round(formattedValue);
  return roundedFormattedValue;
}
  
/**
 * @param {number} value
 * @returns {number}
 */
export function formatDirection(value) {
  const direction = ((90 - value / Math.PI * 180) + 360) % 360;
  const formattedDirection = Math.round(direction);
  return formattedDirection;
}