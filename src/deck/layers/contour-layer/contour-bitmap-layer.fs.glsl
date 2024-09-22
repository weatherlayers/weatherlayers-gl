#version 300 es
#define SHADER_NAME contour-bitmap-layer-fragment-shader

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
uniform float imageMinValue;
uniform float imageMaxValue;

uniform float interval;
uniform float majorInterval;
uniform float width;
uniform vec4 color;
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
    (!isNaN(imageMinValue) && value < imageMinValue) ||
    (!isNaN(imageMaxValue) && value > imageMaxValue)
  ) {
    // drop value out of bounds
    discard;
  }

  float majorIntervalRatio = majorInterval > interval ? floor(majorInterval / interval) : 1.; // majorInterval < interval: every contour is a major contour
  float contourValue = value / interval;
  float contourMajor = (step(fract(contourValue / majorIntervalRatio), 0.1) + 1.) / 2.; // 1: major contour, 0.5: minor contour
  float contourWidth = width * contourMajor; // minor contour: half width

  // https://stackoverflow.com/a/30909828/1823988
  // https://forum.unity.com/threads/antialiased-grid-lines-fwidth.1010668/
  // https://www.shadertoy.com/view/Mlfyz2
  float factor = abs(fract(contourValue + 0.5) - 0.5); // contour position, min 0: contour, max 0.5: between contours
  float dFactor = length(vec2(dFdx(contourValue), dFdy(contourValue))); // contour derivation, consistent width in screen space; dFdx, dFdy provides better constant thickness than fwidth
  float contour = 1. - clamp((factor / dFactor) + 0.5 - contourWidth, 0., 1.);
  if (dFactor == 0.) {
    // drop flat areas
    contour = 0.;
  }
  float contourOpacity = contour * contourMajor; // minor contour: half opacity

  // contourOpacity += factor; // debug
  vec4 targetColor;
  if (paletteBounds[0] < paletteBounds[1]) {
    float paletteValue = unscale(paletteBounds[0], paletteBounds[1], value);
    targetColor = texture(paletteTexture, vec2(paletteValue, 0.));
  } else {
    targetColor = color;
  }
  fragColor = vec4(targetColor.rgb, targetColor.a * contourOpacity * opacity);

  @include "../../_utils/deck-bitmap-layer-main-end.glsl"
}