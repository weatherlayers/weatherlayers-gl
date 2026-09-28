#version 300 es
#define SHADER_NAME contour-label-anchor-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"
@include "./contour-label.glsl"

out vec4 fragColor;

const float LABEL_TRACE_STEPS = 256.;
const vec2 LABEL_TRACE_DIRECTION = vec2(0.8, 0.6);

bool isLabelInViewBounds(vec2 position, float margin) {
  vec4 bounds = contour.labelViewBounds;
  return position.x >= bounds.x + margin && position.x <= bounds.z - margin && position.y >= bounds.y + margin && position.y <= bounds.w - margin;
}

// pass 1: label anchor and contour identity, each texel is a seed of the candidate grid
// the seed is projected to the nearest labeled contour with Newton's method
// the anchor depends only on the seed and data, independently of viewport, so that labels stay on the same position on the contour
// the contour is traced from the anchor in both directions, clipped to the viewport
// its extreme score in a fixed direction identifies the contour, candidates on the same contour have the same score up to the trace step
// output x, y: anchor Mercator position, z: label value, w: contour score, LABEL_INVALID_SCORE if invalid or not fully in the viewport
void main(void) {
  vec2 index = floor(gl_FragCoord.xy);
  vec2 seed = getLabelCandidateSeedCell(index) * contour.labelGridSize;
  float labelInterval = getLabelInterval();
  float h = getLabelGradientStep();
  fragColor = vec4(0., 0., 0., LABEL_INVALID_SCORE);

  // anchor, iterate until the step is negligible in Mercator units, independently of zoom
  vec2 anchor = seed;
  vec2 gradient = vec2(0.);
  float labelValue = 0.;
  bool converged = false;
  for (float i = 0.; i < 6.; i++) {
    vec4 value = getLabelPositionValueGradient(anchor);
    float gradientLength2 = dot(value.zw, value.zw);
    if (value.y == 0. || gradientLength2 == 0.) {
      return;
    }
    if (i == 0.) {
      labelValue = floor(value.x / labelInterval + 0.5) * labelInterval;
    }
    gradient = value.zw;
    vec2 delta = (value.x - labelValue) * gradient / gradientLength2;
    anchor -= delta;
    if (length(delta) < 0.001 * h) {
      converged = true;
      break;
    }
  }
  if (!converged || any(greaterThan(abs(anchor - seed), vec2(contour.labelGridSize / 2.)))) {
    return;
  }
  if (!isLabelInViewBounds(anchor, contour.labelMaxHalfWidth * getLabelPixelSize(anchor))) {
    return;
  }

  // contour identity
  vec2 tangent = normalize(vec2(-gradient.y, gradient.x));
  float score = dot(anchor, LABEL_TRACE_DIRECTION);
  bool closed = false;
  for (float direction = 0.; direction < 2.; direction++) {
    if (closed) {
      break;
    }
    vec2 position = anchor;
    vec2 positionDirection = direction == 0. ? tangent : -tangent;
    for (float i = 0.; i < LABEL_TRACE_STEPS; i++) {
      position += positionDirection * contour.labelTraceStep;
      vec4 value = getLabelPositionValueGradient(position);
      float gradientLength2 = dot(value.zw, value.zw);
      if (value.y == 0. || gradientLength2 == 0.) {
        break;
      }
      position -= (value.x - labelValue) * value.zw / gradientLength2;
      if (!isLabelInViewBounds(position, 0.)) {
        break;
      }
      vec2 nextDirection = normalize(vec2(-value.w, value.z));
      positionDirection = dot(nextDirection, positionDirection) >= 0. ? nextDirection : -nextDirection;
      score = max(score, dot(position, LABEL_TRACE_DIRECTION));
      if (i > 2. && length(position - anchor) < contour.labelTraceStep) {
        closed = true;
        break;
      }
    }
  }

  fragColor = vec4(anchor, labelValue, score);
}
