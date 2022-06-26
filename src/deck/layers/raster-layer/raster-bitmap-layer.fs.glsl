#define SHADER_NAME raster-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../../_utils/deck-bitmap-layer-decl.glsl"
@include "../../../_utils/pixel.glsl"
@include "../../../_utils/pixel-value.glsl"

uniform sampler2D imageTexture;
uniform sampler2D imageTexture2;
uniform vec2 imageTexelSize;
uniform bool imageInterpolate;
uniform float imageWeight;
uniform bool imageTypeVector;
uniform vec2 imageUnscale;
uniform sampler2D paletteTexture;
uniform vec2 paletteBounds;

void main(void) {
  @include "../../../_utils/deck-bitmap-layer-main-start.glsl"
  
  vec4 pixel = getPixelInterpolate(imageTexture, imageTexture2, imageTexelSize, imageInterpolate, imageWeight, uv);
  if (!hasPixelValue(pixel, imageUnscale)) {
    // drop nodata
    discard;
  }

  float value = getPixelMagnitudeValue(pixel, imageTypeVector, imageUnscale);
  float paletteValue = unscale(paletteBounds[0], paletteBounds[1], value);
  vec4 color = texture2D(paletteTexture, vec2(paletteValue, 0.));
  gl_FragColor = apply_opacity(color.rgb, color.a * opacity);

  @include "../../../_utils/deck-bitmap-layer-main-end.glsl"

  if (picking_uActive) {
    float directionValue = getPixelDirectionValue(pixel, imageTypeVector, imageUnscale);
    gl_FragColor = vec4(paletteValue, directionValue, 0, 1);
  }
}