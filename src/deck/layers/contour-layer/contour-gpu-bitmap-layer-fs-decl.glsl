/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
uniform sampler2D bitmapTexture2;
uniform float imageWeight;
uniform bool imageTypeVector;
uniform vec2 imageUnscale;
uniform float delta;
uniform vec4 color;
uniform float width;
uniform float rasterOpacity;

bool isNaN(float value) {
  return !(value <= 0. || 0. <= value);
}

bool raster_has_values(vec4 values) {
  if (imageUnscale[0] < imageUnscale[1]) {
    return values.a == 1.;
  } else {
    return !isNaN(values.x);
  }
}

float raster_get_value(vec4 color) {
  float value;
  if (imageTypeVector) {
    if (imageUnscale[0] < imageUnscale[1]) {
      value = length(mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), color.xy));
    } else {
      value = length(color.xy);
    }
  } else {
    if (imageUnscale[0] < imageUnscale[1]) {
      value = mix(imageUnscale[0], imageUnscale[1], color.x);
    } else {
      value = color.x;
    }
  }

  return value;
}

vec4 raster_apply_opacity(vec3 color, float alpha) {
  return mix(vec4(0.), vec4(color, 1.), alpha);
}