/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {[number, number, number, number]} bounds
 * @returns {[number, number, number, number]}
 */
export function mercatorBounds(bounds) {
  const mercatorBounds = /** @type {[number, number, number, number]} */ ([
    bounds[0],
    Math.max(bounds[1], -85.051129),
    bounds[2],
    Math.min(bounds[3], 85.051129),
  ]);
  return mercatorBounds;
}