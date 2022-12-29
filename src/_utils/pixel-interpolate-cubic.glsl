// cubic B-spline
vec4 BS_A = vec4( 3.0, -6.0,   0.0, 4.0) / 6.0;
vec4 BS_B = vec4(-1.0,  6.0, -12.0, 8.0) / 6.0;

vec4 powers(float x) { 
  return vec4(x*x*x, x*x, x, 1.0); 
}

vec4 spline(float x, vec4 c0, vec4 c1, vec4 c2, vec4 c3 ) {
  return
    c0 * dot(BS_B, powers(x + 1.)) + 
    c1 * dot(BS_A, powers(x     )) +
    c2 * dot(BS_A, powers(1. - x)) + 
    c3 * dot(BS_B, powers(2. - x));
}

vec4 SAM(sampler2D image, vec2 iuv, int a, int b, vec2 imageResolution) {
  return texture2D(image, (iuv + vec2(a, b) + 0.5) / imageResolution);
}

// see https://www.shadertoy.com/view/XsSXDy
vec4 getPixelInterpolateCubic(sampler2D image, vec2 imageResolution, vec2 uv) {
  vec2 tuv = uv * imageResolution - 0.5;
  vec2 iuv = floor(tuv);
  vec2 fuv = fract(tuv);

  vec4 color = spline(fuv.y, 
    spline(fuv.x, SAM(image, iuv, -1, -1, imageResolution), SAM(image, iuv, 0, -1, imageResolution), SAM(image, iuv, 1, -1, imageResolution), SAM(image, iuv, 2, -1, imageResolution)),
    spline(fuv.x, SAM(image, iuv, -1,  0, imageResolution), SAM(image, iuv, 0,  0, imageResolution), SAM(image, iuv, 1,  0, imageResolution), SAM(image, iuv, 2,  0, imageResolution)),
    spline(fuv.x, SAM(image, iuv, -1,  1, imageResolution), SAM(image, iuv, 0,  1, imageResolution), SAM(image, iuv, 1,  1, imageResolution), SAM(image, iuv, 2,  1, imageResolution)),
    spline(fuv.x, SAM(image, iuv, -1,  2, imageResolution), SAM(image, iuv, 0,  2, imageResolution), SAM(image, iuv, 1,  2, imageResolution), SAM(image, iuv, 2,  2, imageResolution))
  );

  // fix monotonicity in alpha channel
  if (color.a > 0.5) {
    color.a = 1.;
  } else {
    color.a = 0.;
  }

  return color;
}