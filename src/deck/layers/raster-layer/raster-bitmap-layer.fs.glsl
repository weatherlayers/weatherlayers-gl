#version 300 es
#define SHADER_NAME raster-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/deck-bitmap-layer-decl.glsl"
@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"

uniform sampler2D imageTexture;
uniform sampler2D imageTexture2;
uniform vec2 imageResolution;
uniform float imageSmoothing;
uniform float imageInterpolation;
uniform float imageWeight;
uniform float imageType;
uniform vec2 imageUnscale;
uniform vec2 imageValueBounds;

uniform sampler2D paletteTexture;
uniform vec2 paletteBounds;

void main(void) {
  @include "../../_utils/deck-bitmap-layer-main-start.glsl"
  
  vec4 pixel = getPixelSmoothInterpolate(imageTexture, imageTexture2, imageResolution, imageSmoothing, imageInterpolation, imageWeight, uv);
  if (!hasPixelValue(pixel, imageUnscale)) {
    // drop nodata
    discard;
  }

  float value = getPixelMagnitudeValue(pixel, imageType, imageUnscale);
  if (
    (!isNaN(imageValueBounds.x) && value < imageValueBounds.x) ||
    (!isNaN(imageValueBounds.y) && value > imageValueBounds.y)
  ) {
    // drop value out of bounds
    discard;
  }

  float paletteValue = unscale(paletteBounds[0], paletteBounds[1], value);
  vec4 color = texture(paletteTexture, vec2(paletteValue, 0.));
  fragColor = apply_opacity(color.rgb, color.a * opacity);

  @include "../../_utils/deck-bitmap-layer-main-end.glsl"

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    float directionValue = getPixelDirectionValue(pixel, imageType, imageUnscale);
    fragColor = vec4(paletteValue, directionValue, 0, 1);
  }
}