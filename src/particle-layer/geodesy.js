/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
// see https://www.movable-type.co.uk/scripts/latlong.html
// https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js

// Earth radius used by deck.gl, see https://github.com/visgl/deck.gl/blob/master/modules/core/src/viewports/globe-viewport.js#L10
const EARTH_RADIUS = 6370972;

function toRadians(value) {
  return value / 180 * Math.PI;
}

export function distance(start, end) {
  const φ1 = toRadians(start[1]), λ1 = toRadians(start[0]);
  const φ2 = toRadians(end[1]),   λ2 = toRadians(end[0]);
  const Δφ = φ2 - φ1;
  const Δλ = λ2 - λ1;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = EARTH_RADIUS * c;

  return d;
}