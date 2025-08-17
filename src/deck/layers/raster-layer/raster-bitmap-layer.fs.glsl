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

  vec4 targetColor = applyPalette(paletteTexture, palette.paletteBounds, palette.paletteColor, value);
  fragColor = apply_opacity(targetColor.rgb, targetColor.a * layer.opacity);

  // render border at texture edges if enabled
  if (bool(raster.borderEnabled)) {
    // render border line
    vec2 pixelSize = vec2(length(dFdx(uv)), length(dFdy(uv)));
    vec2 borderWidth = raster.borderWidth / 2.0 * pixelSize;
    if ((uv.x < borderWidth.x || uv.x > 1.0 - borderWidth.x) || (uv.y < borderWidth.y || uv.y > 1.0 - borderWidth.y)) {
      fragColor = apply_opacity(raster.borderColor.rgb, raster.borderColor.a * layer.opacity * 2.);
    }
  }

  // render grid at texel centers if enabled
  if (bool(raster.gridEnabled)) {
    // copied from getPixelSmoothInterpolate
    float imageDownscaleResolutionFactor = 1. + max(0., raster.imageSmoothing);
    vec2 imageDownscaleResolution = raster.imageResolution / imageDownscaleResolutionFactor;

    // copied from getPixelInterpolate
    vec2 uvWithOffset;
    uvWithOffset.x = bitmap2.isRepeatBounds ?
      uv.x + 0.5 / imageDownscaleResolution.x :
      mix(0. + 0.5 / imageDownscaleResolution.x, 1. - 0.5 / imageDownscaleResolution.x, uv.x);
    uvWithOffset.y =
      mix(0. + 0.5 / imageDownscaleResolution.y, 1. - 0.5 / imageDownscaleResolution.y, uv.y);

    // copied from getPixelLinear
    vec2 tuv = uvWithOffset * imageDownscaleResolution - 0.5;
    vec2 fuv = fract(tuv);

    // render grid dot
    vec2 pixelSize = vec2(length(dFdx(uv)), length(dFdy(uv)));
    vec2 gridSize = raster.gridSize / 2.0 * pixelSize * raster.imageResolution;
    if ((fuv.x < gridSize.x || fuv.x > 1.0 - gridSize.x) && (fuv.y < gridSize.y || fuv.y > 1.0 - gridSize.y)) {
      fragColor = apply_opacity(raster.gridColor.rgb, raster.gridColor.a * layer.opacity * 2.);
    }
  }

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    float paletteValue = getPaletteValue(palette.paletteBounds[0], palette.paletteBounds[1], value);
    float directionValue = getPixelDirectionValue(pixel, raster.imageType, raster.imageUnscale);
    fragColor = vec4(paletteValue, directionValue, 0, 1);
  }
}