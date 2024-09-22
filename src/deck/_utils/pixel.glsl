vec4 getPixel(sampler2D image, vec2 imageDownscaleResolution, vec2 iuv, vec2 offset) {
  vec2 uv = (iuv + offset + 0.5) / imageDownscaleResolution;

  return texture(image, uv);
}

// cubic B-spline
const vec4 BS_A = vec4( 3.0, -6.0,   0.0, 4.0) / 6.0;
const vec4 BS_B = vec4(-1.0,  6.0, -12.0, 8.0) / 6.0;

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
  color.a = (c0.a > 0. && c1.a > 0. && c2.a > 0. && c3.a > 0.) ? max(max(max(c0.a, c1.a), c2.a), c3.a) : 0.;

  return color;
}

// see https://www.shadertoy.com/view/XsSXDy
vec4 getPixelCubic(sampler2D image, vec2 imageDownscaleResolution, vec2 uv) {
  vec2 tuv = uv * imageDownscaleResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  return spline(
    spline(getPixel(image, imageDownscaleResolution, iuv, vec2(-1, -1)), getPixel(image, imageDownscaleResolution, iuv, vec2(0, -1)), getPixel(image, imageDownscaleResolution, iuv, vec2(1, -1)), getPixel(image, imageDownscaleResolution, iuv, vec2(2, -1)), fuv.x),
    spline(getPixel(image, imageDownscaleResolution, iuv, vec2(-1,  0)), getPixel(image, imageDownscaleResolution, iuv, vec2(0,  0)), getPixel(image, imageDownscaleResolution, iuv, vec2(1,  0)), getPixel(image, imageDownscaleResolution, iuv, vec2(2,  0)), fuv.x),
    spline(getPixel(image, imageDownscaleResolution, iuv, vec2(-1,  1)), getPixel(image, imageDownscaleResolution, iuv, vec2(0,  1)), getPixel(image, imageDownscaleResolution, iuv, vec2(1,  1)), getPixel(image, imageDownscaleResolution, iuv, vec2(2,  1)), fuv.x),
    spline(getPixel(image, imageDownscaleResolution, iuv, vec2(-1,  2)), getPixel(image, imageDownscaleResolution, iuv, vec2(0,  2)), getPixel(image, imageDownscaleResolution, iuv, vec2(1,  2)), getPixel(image, imageDownscaleResolution, iuv, vec2(2,  2)), fuv.x),
    fuv.y
  );
}

// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 getPixelLinear(sampler2D image, vec2 imageDownscaleResolution, vec2 uv) {
  vec2 tuv = uv * imageDownscaleResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  return mix(
    mix(getPixel(image, imageDownscaleResolution, iuv, vec2(0, 0)), getPixel(image, imageDownscaleResolution, iuv, vec2(1, 0)), fuv.x),
    mix(getPixel(image, imageDownscaleResolution, iuv, vec2(0, 1)), getPixel(image, imageDownscaleResolution, iuv, vec2(1, 1)), fuv.x),
    fuv.y
  );
}

vec4 getPixelNearest(sampler2D image, vec2 imageDownscaleResolution, vec2 uv) {
  vec2 tuv = uv * imageDownscaleResolution - 0.5;
  vec2 iuv = floor(tuv + 0.5); // nearest

  return getPixel(image, imageDownscaleResolution, iuv, vec2(0, 0));
}

vec4 getPixelFilter(sampler2D image, vec2 imageDownscaleResolution, float imageInterpolation, vec2 uv) {
  if (imageInterpolation == 2.) {
    return getPixelCubic(image, imageDownscaleResolution, uv);
  } if (imageInterpolation == 1.) {
    return getPixelLinear(image, imageDownscaleResolution, uv);
  } else {
    return getPixelNearest(image, imageDownscaleResolution, uv);
  }
}

vec4 getPixelInterpolate(sampler2D image, sampler2D image2, vec2 imageDownscaleResolution, float imageInterpolation, float imageWeight, vec2 uv) {
  // offset
  // test case: gfswave/significant_wave_height, Gibraltar (36, -5.5)
  vec2 uvWithOffset = vec2(uv.x + 0.5 / imageDownscaleResolution.x, uv.y);

  if (imageWeight > 0.) {
    vec4 pixel = getPixelFilter(image, imageDownscaleResolution, imageInterpolation, uvWithOffset);
    vec4 pixel2 = getPixelFilter(image2, imageDownscaleResolution, imageInterpolation, uvWithOffset);
    return mix(pixel, pixel2, imageWeight);
  } else {
    return getPixelFilter(image, imageDownscaleResolution, imageInterpolation, uvWithOffset);
  }
}

vec4 getPixelSmoothInterpolate(sampler2D image, sampler2D image2, vec2 imageResolution, float imageSmoothing, float imageInterpolation, float imageWeight, vec2 uv) {
  // smooth by downscaling resolution
  float imageDownscaleResolutionFactor = 1. + max(0., imageSmoothing);
  vec2 imageDownscaleResolution = imageResolution / imageDownscaleResolutionFactor;

  return getPixelInterpolate(image, image2, imageDownscaleResolution, imageInterpolation, imageWeight, uv);
}