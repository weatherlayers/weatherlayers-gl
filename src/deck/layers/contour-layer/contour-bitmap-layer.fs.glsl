#version 300 es
#define SHADER_NAME contour-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"

in vec2 vTexCoord;
in vec2 vTexPos;
out vec4 fragColor;

void main(void) {
  vec2 uv = getUVWithCoordinateConversion(vTexCoord, vTexPos);
  
  vec4 pixel = getPixelSmoothInterpolate(imageTexture, imageTexture2, raster.imageResolution, raster.imageSmoothing, raster.imageInterpolation, raster.imageWeight, bitmap2.isRepeatBounds, uv);
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

  float majorIntervalRatio = contour.majorInterval > contour.interval ? floor(contour.majorInterval / contour.interval) : 1.; // majorInterval < interval: every contour is a major contour
  float contourValue = value / contour.interval;
  float contourMajor = (step(fract(contourValue / majorIntervalRatio), 0.1) + 1.) / 2.; // 1: major contour, 0.5: minor contour
  float contourWidth = contour.width * contourMajor; // minor contour: half width

  // https://stackoverflow.com/a/30909828/1823988
  // https://forum.unity.com/threads/antialiased-grid-lines-fwidth.1010668/
  // https://www.shadertoy.com/view/Mlfyz2
  float factor = abs(fract(contourValue + 0.5) - 0.5); // contour position, min 0: contour, max 0.5: between contours
  float dFactor = length(vec2(dFdx(contourValue), dFdy(contourValue))); // contour derivation, consistent width in screen space; dFdx, dFdy provides better constant thickness than fwidth
  float contourOpacity = 1. - clamp((factor / dFactor) + 0.5 - contourWidth, 0., 1.);
  if (dFactor == 0.) {
    // drop flat areas
    contourOpacity = 0.;
  }
  float contourOpacityMajor = contourOpacity * contourMajor; // minor contour: half opacity

  // contourOpacityMajor += factor; // debug
  vec4 targetColor = applyPalette(paletteTexture, palette.paletteBounds, palette.paletteColor, value);
  fragColor = vec4(targetColor.rgb, targetColor.a * contourOpacityMajor * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}