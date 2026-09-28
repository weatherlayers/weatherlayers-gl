#version 300 es
#define SHADER_NAME contour-label-select-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"
@include "./contour-label.glsl"

out vec4 fragColor;

// pass 2: a single label per contour
// a candidate is visible if no other candidate on the same contour has a higher priority
// output x: 1 if visible, 0 otherwise
void main(void) {
  vec2 index = floor(gl_FragCoord.xy);
  vec4 candidate = texture(labelAnchorTexture, getLabelCandidateTexCoord(index));
  fragColor = vec4(0.);
  if (candidate.w <= LABEL_INVALID_SCORE) {
    return;
  }

  float priority = getLabelSeedPriority(getLabelCandidateSeedCell(index));
  float order = index.y * contour.labelGridCount.x + index.x;
  float labelInterval = getLabelInterval();
  for (float y = 0.; y < LABEL_MAX_GRID_COUNT; y++) {
    if (y >= contour.labelGridCount.y) {
      break;
    }
    for (float x = 0.; x < LABEL_MAX_GRID_COUNT; x++) {
      if (x >= contour.labelGridCount.x) {
        break;
      }
      vec4 other = texture(labelAnchorTexture, getLabelCandidateTexCoord(vec2(x, y)));
      if (
        other.w <= LABEL_INVALID_SCORE ||
        abs(other.z - candidate.z) > 0.5 * labelInterval ||
        abs(other.w - candidate.w) > 2. * contour.labelTraceStep
      ) {
        continue;
      }
      float otherPriority = getLabelSeedPriority(getLabelCandidateSeedCell(vec2(x, y)));
      float otherOrder = y * contour.labelGridCount.x + x;
      if (otherPriority > priority || (otherPriority == priority && otherOrder < order)) {
        return;
      }
    }
  }

  fragColor = vec4(1.);
}
