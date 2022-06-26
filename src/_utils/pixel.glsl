// texture2D with software bilinear filtering
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 getPixelBilinear(sampler2D image, vec2 imageTexelSize, vec2 uv) {
  // Calculate pixels to sample and interpolating factor
  uv -= imageTexelSize * 0.5;
  vec2 factor = fract(uv / imageTexelSize);

  // Snap to corner of texel and then move to center
  vec2 uvSnapped = uv - imageTexelSize * factor + imageTexelSize * 0.5;

  vec4 topLeft = texture2D(image, uvSnapped);
  vec4 topRight = texture2D(image, uvSnapped + vec2(imageTexelSize.x, 0));
  vec4 bottomLeft = texture2D(image, uvSnapped + vec2(0, imageTexelSize.y));
  vec4 bottomRight = texture2D(image, uvSnapped + imageTexelSize);
  vec4 top = mix(topLeft, topRight, factor.x);
  vec4 bottom = mix(bottomLeft, bottomRight, factor.x);
  return mix(top, bottom, factor.y);
}

vec4 getPixelFilter(sampler2D image, vec2 imageTexelSize, bool imageInterpolate, vec2 uv) {
  // Offset (test case: Gibraltar)
  uv += imageTexelSize * 0.5;

  if (imageInterpolate) {
    return getPixelBilinear(image, imageTexelSize, uv);
  } else {
    return texture2D(image, uv);
  }
}

vec4 getPixelInterpolate(sampler2D image, sampler2D image2, vec2 imageTexelSize, bool imageInterpolate, float imageWeight, vec2 uv) {
  if (imageWeight > 0.) {
    vec4 pixel = getPixelFilter(image, imageTexelSize, imageInterpolate, uv);
    vec4 pixel2 = getPixelFilter(image2, imageTexelSize, imageInterpolate, uv);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageTexelSize, imageInterpolate, uv);
  }
}