vec4 pixel = getPixelInterpolate(bitmapTexture, bitmapTexture2, imageTexelSize, imageInterpolate, imageWeight, uv);

// drop nodata
if (!raster_has_values(pixel)) {
  discard;
}

float value = raster_get_value(pixel);
float paletteValue = raster_get_palette_value(value);
vec4 color = texture2D(paletteTexture, vec2(paletteValue, 0.));
gl_FragColor = apply_opacity(color.rgb, color.a * opacity);

if (picking_uActive) {
  float directionValue = raster_get_direction_value(pixel);
  gl_FragColor = vec4(paletteValue, directionValue, 0, 1);
}