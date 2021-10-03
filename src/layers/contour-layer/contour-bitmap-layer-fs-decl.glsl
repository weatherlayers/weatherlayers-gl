// Copyright (c) 2021 WeatherLayers.com
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
uniform sampler2D bitmapTexture2;
uniform float imageWeight;
uniform float imageScalarize;
uniform float imageUnscale;
uniform vec2 imageBounds;
uniform float delta;
uniform vec4 color;
uniform float width;
uniform float rasterOpacity;

bool isNaN(float value) {
  return (value <= 0.0 || 0.0 <= value) ? false : true;
}

bool raster_has_values(vec4 values) {
  if (imageUnscale) {
    return values.a == 1.0;
  } else {
    return !isNaN(values.x);
  }
}

float raster_get_value(vec4 color) {
  float value;
  if (imageScalarize > 0.5) {
    if (imageUnscale > 0.5) {
      value = length(mix(vec2(imageBounds[0]), vec2(imageBounds[1]), color.xy));
    } else {
      value = length(color.xy);
    }
  } else {
    if (imageUnscale > 0.5) {
      value = mix(imageBounds[0], imageBounds[1], color.x);
    } else {
      value = color.x;
    }
  }

  return value;
}

vec4 raster_apply_opacity(vec3 color, float alpha) {
  return mix(vec4(0.), vec4(color, 1.), alpha);
}