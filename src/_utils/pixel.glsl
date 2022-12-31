vec4 getPixel(sampler2D image, vec2 imageResolution, vec2 iuv, int offsetX, int offsetY) {
  return texture2D(image, (iuv + vec2(offsetX, offsetY) + 0.5) / imageResolution);
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
vec4 getPixelCubic(sampler2D image, vec2 imageResolution, vec2 uv) {
  vec2 tuv = uv * imageResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  return spline(
    spline(getPixel(image, imageResolution, iuv, -1, -1), getPixel(image, imageResolution, iuv, 0, -1), getPixel(image, imageResolution, iuv, 1, -1), getPixel(image, imageResolution, iuv, 2, -1), fuv.x),
    spline(getPixel(image, imageResolution, iuv, -1,  0), getPixel(image, imageResolution, iuv, 0,  0), getPixel(image, imageResolution, iuv, 1,  0), getPixel(image, imageResolution, iuv, 2,  0), fuv.x),
    spline(getPixel(image, imageResolution, iuv, -1,  1), getPixel(image, imageResolution, iuv, 0,  1), getPixel(image, imageResolution, iuv, 1,  1), getPixel(image, imageResolution, iuv, 2,  1), fuv.x),
    spline(getPixel(image, imageResolution, iuv, -1,  2), getPixel(image, imageResolution, iuv, 0,  2), getPixel(image, imageResolution, iuv, 1,  2), getPixel(image, imageResolution, iuv, 2,  2), fuv.x),
    fuv.y
  );
}

// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 getPixelLinear(sampler2D image, vec2 imageResolution, vec2 uv) {
  vec2 tuv = uv * imageResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  return mix(
    mix(getPixel(image, imageResolution, iuv, 0, 0), getPixel(image, imageResolution, iuv, 1, 0), fuv.x),
    mix(getPixel(image, imageResolution, iuv, 0, 1), getPixel(image, imageResolution, iuv, 1, 1), fuv.x),
    fuv.y
  );
}

vec4 getPixelNearest(sampler2D image, vec2 imageResolution, vec2 uv) {
  vec2 tuv = uv * imageResolution - 0.5;
  vec2 iuv = floor(tuv + 0.5); // round

  return getPixel(image, imageResolution, iuv, 0, 0);
}

vec4 getPixelFilter(sampler2D image, vec2 imageResolution, int imageInterpolation, vec2 uv) {
  // Offset
  // Test case: gfswave/significant_wave_height, Gibraltar (36, -5.5)
  uv.x += 0.5 / imageResolution.x;

  if (imageInterpolation == 2) {
    return getPixelCubic(image, imageResolution, uv);
  } if (imageInterpolation == 1) {
    return getPixelLinear(image, imageResolution, uv);
  } else {
    return getPixelNearest(image, imageResolution, uv);
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