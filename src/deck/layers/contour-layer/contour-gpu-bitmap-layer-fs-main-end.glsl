bitmapColor = texture2DFilter(bitmapTexture, imageResolution, imageInterpolate, uv);
if (imageWeight > 0.) {
  vec4 bitmapColor2 = texture2DFilter(bitmapTexture2, imageResolution, imageInterpolate, uv);
  bitmapColor = mix(bitmapColor, bitmapColor2, imageWeight);
}

// drop nodata
if (!raster_has_values(bitmapColor)) {
  discard;
}

float value = raster_get_value(bitmapColor);
float contourValueFract = abs(fract(value / interval) - 0.5) * 2.;
float contourValueFwidth = fwidth(value / interval);
float contourValue = 1. - smoothstep(contourValueFwidth * 1., contourValueFwidth * 2., contourValueFract);
vec4 rasterColor = vec4(color.rgb, color.a * contourValue);
gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);