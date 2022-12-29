#define SHADER_NAME contour-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../../_utils/deck-bitmap-layer-decl.glsl"
@include "../../../_utils/pixel.glsl"
@include "../../../_utils/pixel-value.glsl"

uniform sampler2D imageTexture;
uniform sampler2D imageTexture2;
uniform vec2 imageResolution;
uniform int imageInterpolation;
uniform float imageWeight;
uniform bool imageTypeVector;
uniform vec2 imageUnscale;
uniform float interval;
uniform float width;
uniform vec4 color;

void main(void) {
  @include "../../../_utils/deck-bitmap-layer-main-start.glsl"
  
  vec4 pixel = getPixelInterpolate(imageTexture, imageTexture2, imageResolution, imageInterpolation, imageWeight, uv);
  if (!hasPixelValue(pixel, imageUnscale)) {
    // drop nodata
    discard;
  }

  float value = getPixelMagnitudeValue(pixel, imageTypeVector, imageUnscale);
  float contourValue = value / interval;
  float contourMajor = (step(fract(contourValue * 0.2), 0.1) + 1.) / 2.; // 1: major contour every fifth contour, 0.5: minor contour
  float contourWidth = width * contourMajor; // minor contour: half width

  // https://stackoverflow.com/a/30909828/1823988
  // https://forum.unity.com/threads/antialiased-grid-lines-fwidth.1010668/
  // https://www.shadertoy.com/view/Mlfyz2
  float factor = abs(fract(contourValue + 0.5) - 0.5); // contour position, min 0: contour, max 0.5: between contours
  float dFactor = fwidth(contourValue); // contour derivation, consistent width in screen space
  float contour = 1. - clamp((factor / dFactor) + 0.5 - contourWidth, 0., 1.);
  if (dFactor == 0.) {
    // drop flat areas
    contour = 0.;
  }
  float contourOpacity = contour * contourMajor; // minor contour: half opacity

  // contourOpacity += factor; // debug
  gl_FragColor = vec4(color.rgb, color.a * contourOpacity * opacity);

  @include "../../../_utils/deck-bitmap-layer-main-end.glsl"
}