#version 300 es
#define SHADER_NAME contour-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"
@include "./contour-label.glsl"

in vec2 vTexCoord;
in vec2 vTexPos;
out vec4 fragColor;

const float LABEL_MAX_SEARCH_RADIUS = 4.;

// labels are selected by ContourLabelPasses, roughly a single label per visible contour
// the fragment draws visible labels of nearby grid cells, anchors are within their grid cell
// x: fill coverage, y: fill + outline coverage, z: contour gap mask, w: label value
vec4 getLabel(vec2 mercator, vec2 mercatorDx, vec2 mercatorDy) {
  float gridSize = contour.labelGridSize;
  if (gridSize <= 0.) {
    return vec4(0.);
  }

  // fragment position relative to anchors in screen space, with the local inverse Jacobian of the Mercator position
  float jacobian = mercatorDx.x * mercatorDy.y - mercatorDy.x * mercatorDx.y;
  if (jacobian == 0.) {
    return vec4(0.);
  }
  mat2 inverseJacobian = mat2(mercatorDy.y, -mercatorDx.y, -mercatorDy.x, mercatorDx.x) / jacobian;

  vec4 label = vec4(0.);
  float fragmentColumn = floor(mercator.x / gridSize + 0.5);
  for (float columnOffset = -LABEL_MAX_SEARCH_RADIUS; columnOffset <= LABEL_MAX_SEARCH_RADIUS; columnOffset++) {
    if (abs(columnOffset) > contour.labelSearchRadius) {
      continue;
    }
    float column = fragmentColumn + columnOffset;
    float fragmentRow = floor(mercator.y / gridSize - mod(column, 2.) * 0.5 + 0.5);
    for (float rowOffset = -LABEL_MAX_SEARCH_RADIUS; rowOffset <= LABEL_MAX_SEARCH_RADIUS; rowOffset++) {
      if (abs(rowOffset) > contour.labelSearchRadius) {
        continue;
      }
      vec2 index = getLabelCandidateIndex(column, fragmentRow + rowOffset);
      if (index.x < 0.) {
        continue;
      }
      vec2 texCoord = getLabelCandidateTexCoord(index);
      if (texture(labelVisibleTexture, texCoord).r < 0.5) {
        continue;
      }

      vec4 candidate = texture(labelAnchorTexture, texCoord);
      vec2 screenOffset = inverseJacobian * getLabelWrappedOffset(mercator - candidate.xy);
      if (length(screenOffset) > contour.labelMaxHalfWidth + contour.labelCellSize.y) {
        continue;
      }
      vec4 text = getLabelText(candidate.z);
      if (text.w == 0.) {
        continue;
      }

      // orientation along the contour, upright in screen space
      vec4 anchorValue = getLabelPositionValueGradient(candidate.xy);
      if (anchorValue.y == 0. || dot(anchorValue.zw, anchorValue.zw) == 0.) {
        continue;
      }
      // decided in Mercator space, so that all fragments of the label agree
      vec2 tangent = vec2(-anchorValue.w, anchorValue.z);
      if (dot(tangent, contour.labelScreenRight) < 0.) {
        tangent = -tangent;
      }
      vec2 screenTangent = normalize(inverseJacobian * tangent);
      vec2 screenNormal = vec2(-screenTangent.y, screenTangent.x);
      vec2 local = vec2(dot(screenOffset, screenTangent), dot(screenOffset, screenNormal));

      float textWidth = getLabelTextWidth(text);
      vec2 halfSize = vec2(textWidth / 2. + contour.labelPadding, contour.labelCellSize.y / 2.);
      if (abs(local.x) > halfSize.x + 1. || abs(local.y) > halfSize.y) {
        continue;
      }
      float gap = clamp(halfSize.x + 1. - abs(local.x), 0., 1.);

      // glyph cells overlap in outline padding, combine all glyphs covering the fragment
      vec2 coverage = vec2(0.);
      float atlasY = LABEL_ATLAS_HEADER_HEIGHT + contour.labelCellSize.y / 2. - local.y;
      float penX = -textWidth / 2.;
      for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
        if (i >= text.w) {
          break;
        }
        float glyph = getLabelGlyph(i, text);
        float cellX = local.x - (penX - contour.labelPadding);
        if (cellX >= 0. && cellX <= contour.labelCellSize.x) {
          vec2 atlasPosition = vec2(glyph * contour.labelCellSize.x + cellX, atlasY);
          coverage = max(coverage, texture(labelTexture, atlasPosition / contour.labelTextureSize).rg);
        }
        penX += getLabelGlyphAdvance(glyph);
      }

      if (coverage.y >= label.y) {
        label = vec4(coverage, max(label.z, gap), candidate.z);
      } else {
        label.z = max(label.z, gap);
      }
    }
  }

  return label;
}

void main(void) {
  vec2 uv = getUVWithCoordinateConversion(vTexCoord, vTexPos);

  // Web Mercator position, derivatives in uniform control flow, before discard
  vec2 mercator = lnglat_to_mercator(vec2(mix(bitmap2.bounds[0], bitmap2.bounds[2], uv.x), mix(bitmap2.bounds[3], bitmap2.bounds[1], uv.y)));
  vec2 mercatorDx = dFdx(mercator);
  vec2 mercatorDy = dFdy(mercator);

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

  vec4 label = getLabel(mercator, mercatorDx, mercatorDy);
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
