// texture2D with software bilinear filtering
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 getPixelInterpolateLinear(sampler2D image, vec2 imageResolution, vec2 uv) {
  vec2 imageTexelSize = 1. / imageResolution;

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