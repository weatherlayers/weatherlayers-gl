// Copyright (c) 2021 WeatherLayers.com
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
if (imageWeight > 0.) {
  bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), imageWeight);
}

// drop nodata
if (!hasValues(bitmapColor)) {
  discard;
}

float value = raster_get_value(bitmapColor);
float colormapValue = raster_get_colormap_value(value);
vec4 rasterColor = texture2D(colormapTexture, vec2(colormapValue, 0.));
gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);

if (picking_uActive) {
  float directionValue = raster_get_direction_value(bitmapColor);
  gl_FragColor = vec4(colormapValue, directionValue, 0, 1);
}