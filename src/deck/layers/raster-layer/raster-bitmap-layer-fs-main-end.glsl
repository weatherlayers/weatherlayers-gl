if (imageWeight > 0.) {
  bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), imageWeight);
}

// drop nodata
if (!raster_has_values(bitmapColor)) {
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