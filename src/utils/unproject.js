/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {number} width
 * @param {number} height
 * @param {[number, number, number, number]} bounds
 * @returns {(point: GeoJSON.Position) => GeoJSON.Position}
 */
export function getUnprojectFunction(width, height, bounds) {
  const origin = [bounds[0], bounds[3]]; // top-left
  const lngResolution = (bounds[2] - bounds[0]) / width;
  const latResolution = (bounds[3] - bounds[1]) / height;

  return point => {
    const i = point[0];
    const j = point[1];
    const lng = origin[0] + i * lngResolution;
    const lat = origin[1] + -j * latResolution;
    point = [lng, lat];
    return point;
  };
};