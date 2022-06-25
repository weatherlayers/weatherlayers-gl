bitmapColor = texture2DInterpolate(bitmapTexture, bitmapTexture2, imageTexelSize, imageInterpolate, uv);

// drop nodata
if (!raster_has_values(bitmapColor)) {
  discard;
}

float value = raster_get_value(bitmapColor);
float paletteValue = raster_get_palette_value(value);
vec4 rasterColor = texture2D(paletteTexture, vec2(paletteValue, 0.));
gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);

if (picking_uActive) {
  float directionValue = raster_get_direction_value(bitmapColor);
  gl_FragColor = vec4(paletteValue, directionValue, 0, 1);
}