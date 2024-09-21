#version 300 es
#define SHADER_NAME raster-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"

in vec2 vTexCoord;
in vec2 vTexPos;
out vec4 fragColor;

uniform float opacity; // TODO: replace with layer.opacity

void main(void) {
  vec2 uv = getUVWithCoordinateConversion(vTexCoord, vTexPos);
  
  vec4 pixel = getPixelSmoothInterpolate(imageTexture, imageTexture2, raster.imageResolution, raster.imageSmoothing, raster.imageInterpolation, raster.imageWeight, uv);
  if (!hasPixelValue(pixel, raster.imageUnscale)) {
    // drop nodata
    discard;
  }

  float value = getPixelMagnitudeValue(pixel, raster.imageType, raster.imageUnscale);
  if (
    (!isNaN(raster.imageMinValue) && value < raster.imageMinValue) ||
    (!isNaN(raster.imageMaxValue) && value > raster.imageMaxValue)
  ) {
    // drop value out of bounds
    discard;
  }

  vec4 targetColor = applyPalette(paletteTexture, palette.paletteBounds, palette.paletteColor, value);
  fragColor = apply_opacity(targetColor.rgb, targetColor.a * opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    float paletteValue = getPaletteValue(palette.paletteBounds[0], palette.paletteBounds[1], value);
    float directionValue = getPixelDirectionValue(pixel, raster.imageType, raster.imageUnscale);
    fragColor = vec4(paletteValue, directionValue, 0, 1);
  }
}