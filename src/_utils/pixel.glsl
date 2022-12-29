@include "./pixel-interpolate-cubic.glsl"
@include "./pixel-interpolate-linear.glsl"

vec4 getPixelFilter(sampler2D image, vec2 imageResolution, int imageInterpolation, vec2 uv) {
  vec2 imageTexelSize = 1. / imageResolution;

  // Offset
  // Test case: Gibraltar (36, -5.5)
  uv.x += imageTexelSize.x * 0.5;

  if (imageInterpolation == 2) {
    return getPixelInterpolateCubic(image, imageResolution, uv);
  } if (imageInterpolation == 1) {
    return getPixelInterpolateLinear(image, imageResolution, uv);
  } else {
    return texture2D(image, uv);
  }
}

vec4 getPixelInterpolate(sampler2D image, sampler2D image2, vec2 imageResolution, int imageInterpolation, float imageWeight, vec2 uv) {
  if (imageWeight > 0.) {
    vec4 pixel = getPixelFilter(image, imageResolution, imageInterpolation, uv);
    vec4 pixel2 = getPixelFilter(image2, imageResolution, imageInterpolation, uv);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageResolution, imageInterpolation, uv);
  }
}