/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
// references for minification:
// uniform sampler2D bitmapTexture2;
// uniform float imageWeight;
// uniform float imageScalarize;
// uniform float imageUnscale;
// uniform vec2 imageBounds;
// uniform float delta;
// uniform vec4 color;
// uniform float width;
// uniform float rasterOpacity;
// bool raster_has_values(vec4 values);
// float raster_get_value(vec4 color);
// vec4 raster_apply_opacity(vec3 color, float alpha);

if (imageWeight > 0.) {
  bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), imageWeight);
}

// drop nodata
if (!raster_has_values(bitmapColor)) {
  discard;
}

float value = raster_get_value(bitmapColor);
float contourValueFract = abs(fract(value / delta) - 0.5) * 2.;
float contourValueFwidth = fwidth(value / delta);
float contourValue = 1. - smoothstep(contourValueFwidth * 1., contourValueFwidth * 2., contourValueFract);
vec4 rasterColor = vec4(color.rgb, contourValue);
gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);