vec4 getPixel(sampler2D image, vec2 imageSmoothResolution, vec2 iuv, vec2 offset) {
  return texture2D(image, (iuv + offset + 0.5) / imageSmoothResolution);
}

// cubic B-spline
vec4 BS_A = vec4( 3.0, -6.0,   0.0, 4.0) / 6.0;
vec4 BS_B = vec4(-1.0,  6.0, -12.0, 8.0) / 6.0;

vec4 powers(float x) { 
  return vec4(x*x*x, x*x, x, 1.0); 
}

vec4 spline(vec4 c0, vec4 c1, vec4 c2, vec4 c3, float a) {
  vec4 color =
    c0 * dot(BS_B, powers(a + 1.)) + 
    c1 * dot(BS_A, powers(a     )) +
    c2 * dot(BS_A, powers(1. - a)) + 
    c3 * dot(BS_B, powers(2. - a));

  // fix precision loss in alpha channel
  color.a = (c0.a == 1. && c1.a == 1. && c2.a == 1. && c3.a == 1.) ? 1. : 0.;

  return color;
}

// see https://www.shadertoy.com/view/XsSXDy
vec4 getPixelCubic(sampler2D image, vec2 imageSmoothResolution, vec2 uv) {
  vec2 tuv = uv * imageSmoothResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  return spline(
    spline(getPixel(image, imageSmoothResolution, iuv, vec2(-1, -1)), getPixel(image, imageSmoothResolution, iuv, vec2(0, -1)), getPixel(image, imageSmoothResolution, iuv, vec2(1, -1)), getPixel(image, imageSmoothResolution, iuv, vec2(2, -1)), fuv.x),
    spline(getPixel(image, imageSmoothResolution, iuv, vec2(-1,  0)), getPixel(image, imageSmoothResolution, iuv, vec2(0,  0)), getPixel(image, imageSmoothResolution, iuv, vec2(1,  0)), getPixel(image, imageSmoothResolution, iuv, vec2(2,  0)), fuv.x),
    spline(getPixel(image, imageSmoothResolution, iuv, vec2(-1,  1)), getPixel(image, imageSmoothResolution, iuv, vec2(0,  1)), getPixel(image, imageSmoothResolution, iuv, vec2(1,  1)), getPixel(image, imageSmoothResolution, iuv, vec2(2,  1)), fuv.x),
    spline(getPixel(image, imageSmoothResolution, iuv, vec2(-1,  2)), getPixel(image, imageSmoothResolution, iuv, vec2(0,  2)), getPixel(image, imageSmoothResolution, iuv, vec2(1,  2)), getPixel(image, imageSmoothResolution, iuv, vec2(2,  2)), fuv.x),
    fuv.y
  );
}

// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 getPixelLinear(sampler2D image, vec2 imageSmoothResolution, vec2 uv) {
  vec2 tuv = uv * imageSmoothResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  return mix(
    mix(getPixel(image, imageSmoothResolution, iuv, vec2(0, 0)), getPixel(image, imageSmoothResolution, iuv, vec2(1, 0)), fuv.x),
    mix(getPixel(image, imageSmoothResolution, iuv, vec2(0, 1)), getPixel(image, imageSmoothResolution, iuv, vec2(1, 1)), fuv.x),
    fuv.y
  );
}

vec4 getPixelNearest(sampler2D image, vec2 imageSmoothResolution, vec2 uv) {
  vec2 tuv = uv * imageSmoothResolution - 0.5;
  vec2 iuv = floor(tuv + 0.5); // nearest

  return getPixel(image, imageSmoothResolution, iuv, vec2(0, 0));
}

vec4 getPixelFilter(sampler2D image, vec2 imageSmoothResolution, int imageInterpolation, vec2 uv) {
  // Offset
  // Test case: gfswave/significant_wave_height, Gibraltar (36, -5.5)
  vec2 uvWithOffset = vec2(uv.x + 0.5 / imageSmoothResolution.x, uv.y);

  if (imageInterpolation == 2) {
    return getPixelCubic(image, imageSmoothResolution, uvWithOffset);
  } if (imageInterpolation == 1) {
    return getPixelLinear(image, imageSmoothResolution, uvWithOffset);
  } else {
    return getPixelNearest(image, imageSmoothResolution, uvWithOffset);
  }
}

vec4 getPixelInterpolate(sampler2D image, sampler2D image2, vec2 imageSmoothResolution, int imageInterpolation, float imageWeight, vec2 uv) {
  if (imageWeight > 0.) {
    vec4 pixel = getPixelFilter(image, imageSmoothResolution, imageInterpolation, uv);
    vec4 pixel2 = getPixelFilter(image2, imageSmoothResolution, imageInterpolation, uv);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageSmoothResolution, imageInterpolation, uv);
  }
}

vec4 getPixelSmoothInterpolate(sampler2D image, sampler2D image2, vec2 imageResolution, float imageSmoothing, int imageInterpolation, float imageWeight, vec2 uv) {
  float imageSmoothResolutionFactor = 1. + max(0., imageSmoothing);
  vec2 imageSmoothResolution = imageResolution / imageSmoothResolutionFactor;

  return getPixelInterpolate(image, image2, imageSmoothResolution, imageInterpolation, imageWeight, uv);
}