vec2 uv = vTexCoord;
if (coordinateConversion < -0.5) {
  vec2 lnglat = mercator_to_lnglat(vTexPos);
  uv = getUV(lnglat);
} else if (coordinateConversion > 0.5) {
  vec2 commonPos = lnglat_to_mercator(vTexPos);
  uv = getUV(commonPos);
}