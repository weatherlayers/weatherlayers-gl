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

// glyph indexes in the atlas, see CONTOUR_LABEL_GLYPHS
const float LABEL_GLYPH_MINUS = 10.;
const float LABEL_GLYPH_DOT = 11.;
const float LABEL_MAX_CHARS = 12.;
const float LABEL_MAX_DECIMALS = 4.;
const float LABEL_ATLAS_HEADER_HEIGHT = 2.;

// value at a screen position, extrapolated from the current fragment with texture coordinate derivatives
// exact for flat maps without pitch, where texture coordinates are affine in screen space
// x: value, y: 1 if valid, 0 otherwise
vec2 getLabelPositionValue(vec2 position, vec2 texCoordDx, vec2 texCoordDy, vec2 texPosDx, vec2 texPosDy) {
  vec2 offset = position - gl_FragCoord.xy;
  vec2 texCoord = vTexCoord + texCoordDx * offset.x + texCoordDy * offset.y;
  vec2 texPos = vTexPos + texPosDx * offset.x + texPosDy * offset.y;
  vec2 uv = getUVWithCoordinateConversion(texCoord, texPos);
  if (uv.y < 0. || uv.y > 1. || (!bitmap2.isRepeatBounds && (uv.x < 0. || uv.x > 1.))) {
    return vec2(0.);
  }

  vec4 pixel = getPixelSmoothInterpolate(imageTexture, imageTexture2, raster.imageResolution, raster.imageSmoothing, raster.imageInterpolation, raster.imageWeight, bitmap2.isRepeatBounds, uv);
  if (!hasPixelValue(pixel, raster.imageUnscale)) {
    return vec2(0.);
  }

  float value = getPixelMagnitudeValue(pixel, raster.imageType, raster.imageUnscale);
  if (
    (!isNaN(raster.imageMinValue) && value < raster.imageMinValue) ||
    (!isNaN(raster.imageMaxValue) && value > raster.imageMaxValue)
  ) {
    return vec2(0.);
  }

  return vec2(value, 1.);
}

float getLabelGlyphAdvance(float glyph) {
  return texture(labelTexture, (vec2(glyph, 0.) + 0.5) / contour.labelTextureSize).r * 255.;
}

// digits: rounded absolute value multiplied by 10^decimals, i.e. all digits without the dot
float getLabelGlyph(float charIndex, float digits, float negative, float intDigits, float decimals) {
  if (negative > 0. && charIndex == 0.) {
    return LABEL_GLYPH_MINUS;
  }

  float digitIndex = charIndex - negative;
  if (decimals > 0. && digitIndex == intDigits) {
    return LABEL_GLYPH_DOT;
  }
  if (digitIndex > intDigits) {
    digitIndex -= 1.;
  }

  // multiply instead of pow to keep integers exact
  float digitsCount = intDigits + decimals;
  float divisor = 1.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (i >= digitsCount - 1. - digitIndex) {
      break;
    }
    divisor *= 10.;
  }
  return mod(floor(digits / divisor), 10.);
}

// labels are placed in a staggered screen-space grid, at most one label per cell
// the cell center is projected to the nearest labeled contour with Newton's method, and the label is oriented along the contour
// the label is drawn only if it fits into the cell, so that each fragment needs to evaluate its own cell only
// x: fill coverage, y: fill + outline coverage, z: contour gap mask, w: label value
vec4 getLabel(float labelInterval, vec2 texCoordDx, vec2 texCoordDy, vec2 texPosDx, vec2 texPosDy) {
  float spacing = contour.labelSpacing;
  if (spacing <= 0.) {
    return vec4(0.);
  }

  // staggered grid
  vec2 fragCoord = gl_FragCoord.xy;
  float row = floor(fragCoord.y / spacing);
  float rowOffset = mod(row, 2.) * 0.5 * spacing;
  float col = floor((fragCoord.x - rowOffset) / spacing);
  vec2 cellCenter = vec2((col + 0.5) * spacing + rowOffset, (row + 0.5) * spacing);

  // nearest labeled contour, Newton's method with screen-space gradient
  // the last step reuses the previous gradient, and its length verifies convergence
  const float h = 2.;
  vec2 position = cellCenter;
  vec2 gradient = vec2(0.);
  float labelValue = 0.;
  float lastStep = 0.;
  for (float i = 0.; i < 3.; i++) {
    vec2 value = getLabelPositionValue(position, texCoordDx, texCoordDy, texPosDx, texPosDy);
    if (value.y == 0.) {
      return vec4(0.);
    }
    if (i == 0.) {
      labelValue = floor(value.x / labelInterval + 0.5) * labelInterval;
    }
    if (i < 2.) {
      vec2 valueX = getLabelPositionValue(position + vec2(h, 0.), texCoordDx, texCoordDy, texPosDx, texPosDy);
      vec2 valueY = getLabelPositionValue(position + vec2(0., h), texCoordDx, texCoordDy, texPosDx, texPosDy);
      if (valueX.y == 0. || valueY.y == 0.) {
        return vec4(0.);
      }
      gradient = vec2(valueX.x - value.x, valueY.x - value.x) / h;
    }
    float gradientLength2 = dot(gradient, gradient);
    if (gradientLength2 == 0.) {
      return vec4(0.);
    }
    vec2 delta = (value.x - labelValue) * gradient / gradientLength2;
    position -= delta;
    lastStep = length(delta);
    if (any(greaterThan(abs(position - cellCenter), vec2(spacing / 2.)))) {
      return vec4(0.);
    }
  }
  if (lastStep > 1.) {
    return vec4(0.);
  }

  // text, formatted the same as formatValue
  float displayValue = labelValue * contour.labelScale + contour.labelOffset;
  float decimals = clamp(floor(contour.labelDecimals), 0., LABEL_MAX_DECIMALS);
  float decimalsFactor = 1.;
  for (float i = 0.; i < LABEL_MAX_DECIMALS; i++) {
    if (i >= decimals) {
      break;
    }
    decimalsFactor *= 10.;
  }
  float digits = floor(abs(displayValue) * decimalsFactor + 0.5);
  float negative = displayValue < 0. && digits > 0. ? 1. : 0.;
  float intPart = floor(digits / decimalsFactor);
  float intDigits = 1.;
  float intDigitsFactor = 10.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (intPart < intDigitsFactor) {
      break;
    }
    intDigits += 1.;
    intDigitsFactor *= 10.;
  }
  float charsCount = negative + intDigits + (decimals > 0. ? 1. + decimals : 0.);
  if (charsCount > LABEL_MAX_CHARS) {
    return vec4(0.);
  }

  float textWidth = 0.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (i >= charsCount) {
      break;
    }
    textWidth += getLabelGlyphAdvance(getLabelGlyph(i, digits, negative, intDigits, decimals));
  }

  // orientation along the contour, upright
  vec2 tangent = normalize(vec2(-gradient.y, gradient.x));
  if (tangent.x < 0.) {
    tangent = -tangent;
  }
  vec2 normal = vec2(-tangent.y, tangent.x);

  // drop labels not fitting into the cell
  vec2 halfSize = vec2(textWidth / 2. + contour.labelPadding, contour.labelCellSize.y / 2.);
  vec2 extent = abs(tangent) * halfSize.x + abs(normal) * halfSize.y;
  if (any(greaterThan(abs(position - cellCenter) + extent, vec2(spacing / 2.)))) {
    return vec4(0.);
  }

  vec2 local = vec2(dot(fragCoord - position, tangent), dot(fragCoord - position, normal));
  if (abs(local.x) > halfSize.x + 1. || abs(local.y) > halfSize.y) {
    return vec4(0.);
  }
  float gap = clamp(halfSize.x + 1. - abs(local.x), 0., 1.);

  // glyph cells overlap in outline padding, combine all glyphs covering the fragment
  vec2 coverage = vec2(0.);
  float atlasY = LABEL_ATLAS_HEADER_HEIGHT + contour.labelCellSize.y / 2. - local.y;
  float penX = -textWidth / 2.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (i >= charsCount) {
      break;
    }
    float glyph = getLabelGlyph(i, digits, negative, intDigits, decimals);
    float cellX = local.x - (penX - contour.labelPadding);
    if (cellX >= 0. && cellX <= contour.labelCellSize.x) {
      vec2 atlasPosition = vec2(glyph * contour.labelCellSize.x + cellX, atlasY);
      coverage = max(coverage, texture(labelTexture, atlasPosition / contour.labelTextureSize).rg);
    }
    penX += getLabelGlyphAdvance(glyph);
  }

  return vec4(coverage, gap, labelValue);
}

void main(void) {
  // derivatives in uniform control flow, before discard
  vec2 texCoordDx = dFdx(vTexCoord);
  vec2 texCoordDy = dFdy(vTexCoord);
  vec2 texPosDx = dFdx(vTexPos);
  vec2 texPosDy = dFdy(vTexPos);

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
  float contourIndex = floor(contourValue + 0.5); // nearest contour, consistent on both sides of the contour
  float contourMajor = abs(contourIndex - majorIntervalRatio * floor(contourIndex / majorIntervalRatio + 0.5)) < 0.5 ? 1. : 0.5; // 1: major contour, 0.5: minor contour
  float contourWidth = contour.width * contourMajor; // minor contour: half width

  // https://stackoverflow.com/a/30909828/1823988
  // https://forum.unity.com/threads/antialiased-grid-lines-fwidth.1010668/
  // https://www.shadertoy.com/view/Mlfyz2
  // offset contour position by a small epsilon, so that flat areas with the value exactly on the contour are not filled, the contour is drawn at their boundary instead
  float factor = abs(fract(contourValue + 0.5 + 0.001) - 0.5); // contour position, min 0: contour, max 0.5: between contours
  float dFactor = length(vec2(dFdx(contourValue), dFdy(contourValue))); // contour derivation, consistent width in screen space; dFdx, dFdy provides better constant thickness than fwidth
  float contourOpacity = 1. - clamp((factor / dFactor) + 0.5 - contourWidth, 0., 1.);
  if (dFactor == 0.) {
    // drop flat areas
    contourOpacity = 0.;
  }

  vec4 label = getLabel(contour.interval * majorIntervalRatio, texCoordDx, texCoordDy, texPosDx, texPosDy); // label major contours only
  float contourOpacityMajor = contourOpacity * contourMajor * (1. - label.z); // minor contour: half opacity; gap under the label

  // contourOpacityMajor += factor; // debug
  vec4 targetColor = applyPalette(paletteTexture, palette.paletteBounds, palette.paletteColor, value);
  vec4 lineColor = vec4(targetColor.rgb, targetColor.a * contourOpacityMajor);

  // label over contour
  vec4 labelFillColor = palette.paletteBounds[0] < palette.paletteBounds[1] ? applyPalette(paletteTexture, palette.paletteBounds, palette.paletteColor, label.w) : contour.labelColor;
  vec4 labelColor = mix(contour.labelOutlineColor, labelFillColor, label.y > 0. ? label.x / label.y : 0.);
  labelColor.a *= label.y;
  float alpha = labelColor.a + lineColor.a * (1. - labelColor.a);
  vec3 color = alpha > 0. ? (labelColor.rgb * labelColor.a + lineColor.rgb * lineColor.a * (1. - labelColor.a)) / alpha : vec3(0.);
  fragColor = vec4(color, alpha * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
