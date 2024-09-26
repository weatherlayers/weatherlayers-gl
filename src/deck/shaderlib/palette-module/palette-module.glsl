uniform sampler2D paletteTexture;

uniform paletteUniforms {
  vec2 paletteBounds;
  vec4 paletteColor;
} palette;

float getPaletteValue(float min, float max, float value) {
  return (value - min) / (max - min);
}

vec4 applyPalette(sampler2D paletteTexture, vec2 paletteBounds, vec4 paletteColor, float value) {
  if (paletteBounds[0] < paletteBounds[1]) {
    float paletteValue = getPaletteValue(paletteBounds[0], paletteBounds[1], value);
    return texture(paletteTexture, vec2(paletteValue, 0.));
  } else {
    return paletteColor;
  }
}