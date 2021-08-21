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
 * @returns {(point: GeoJSON.Position) => GeoJSON.Position}
 */
export function getUnprojectFunction(width, height) {
  const origin = [-180, 90];
  const lngResolution = 360 / width;
  const latResolution = 180 / height;

  return point => {
    const i = point[0];
    const j = point[1];
    const lng = origin[0] + i * lngResolution;
    const lat = origin[1] + -j * latResolution;
    point = [lng, lat];
    return point;
  };
};