/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const float RASTER_PI = 3.1415926535;

uniform sampler2D bitmapTexture2;
uniform float imageWeight;
uniform float imageScalarize;
uniform float imageUnscale;
uniform vec2 imageBounds;
uniform sampler2D colormapTexture;
uniform vec2 colormapBounds;
uniform float rasterOpacity;

float unscale(float min, float max, float value) {
  return (value - min) / (max - min);
}

// see https://stackoverflow.com/a/27228836/1823988
float atan2(float y, float x) {
  return x == 0. ? sign(y) * RASTER_PI / 2. : atan(y, x);
}

bool isNaN(float value) {
  return (value <= 0.0 || 0.0 <= value) ? false : true;
}

bool raster_has_values(vec4 values) {
  if (imageUnscale > 0.5) {
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

float raster_get_colormap_value(float value) {
  return unscale(colormapBounds[0], colormapBounds[1], value);
}

float raster_get_direction_value(vec4 color) {
  if (imageScalarize > 0.5) {
    vec2 value;
    if (imageUnscale > 0.5) {
      value = mix(vec2(imageBounds[0]), vec2(imageBounds[1]), color.xy);
    } else {
      value = color.xy;
    }

    return atan2(value.y, value.x) / RASTER_PI / 2. + 0.5;
  } else {
    return 0.;
  }
}

vec4 raster_apply_opacity(vec3 color, float alpha) {
  return mix(vec4(0.), vec4(color, 1.), alpha);
}