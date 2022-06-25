uniform sampler2D bitmapTexture2;
uniform vec2 imageTexelSize;
uniform bool imageInterpolate;
uniform float imageWeight;
uniform bool imageTypeVector;
uniform vec2 imageUnscale;
uniform sampler2D paletteTexture;
uniform vec2 paletteBounds;

const float RASTER_PI = 3.1415926535;

float unscale(float min, float max, float value) {
  return (value - min) / (max - min);
}

// see https://stackoverflow.com/a/27228836/1823988
float atan2(float y, float x) {
  return x == 0. ? sign(y) * RASTER_PI / 2. : atan(y, x);
}

bool isNaN(float value) {
  return !(value <= 0. || 0. <= value);
}

// texture2D with software bilinear filtering
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 getPixelBilinear(sampler2D image, vec2 texelSize, vec2 uv) {
  // Calculate pixels to sample and interpolating factor
  uv -= texelSize * 0.5;
  vec2 factor = fract(uv / texelSize);

  // Snap to corner of texel and then move to center
  vec2 uvSnapped = uv - texelSize * factor + texelSize * 0.5;

  vec4 topLeft = texture2D(image, uvSnapped);
  vec4 topRight = texture2D(image, uvSnapped + vec2(texelSize.x, 0));
  vec4 bottomLeft = texture2D(image, uvSnapped + vec2(0, texelSize.y));
  vec4 bottomRight = texture2D(image, uvSnapped + texelSize);
  vec4 top = mix(topLeft, topRight, factor.x);
  vec4 bottom = mix(bottomLeft, bottomRight, factor.x);
  return mix(top, bottom, factor.y);
}

vec4 getPixelFilter(sampler2D image, vec2 texelSize, bool interpolate, vec2 uv) {
  // Offset (test case: Gibraltar)
  uv += texelSize * 0.5;

  if (interpolate) {
    return getPixelBilinear(image, texelSize, uv);
  } else {
    return texture2D(image, uv);
  }
}

vec4 getPixelInterpolate(sampler2D image, sampler2D image2, vec2 texelSize, bool interpolate, float weight, vec2 uv) {
  if (weight > 0.) {
    vec4 pixel = getPixelFilter(image, texelSize, interpolate, uv);
    vec4 pixel2 = getPixelFilter(image2, texelSize, interpolate, uv);
    return mix(pixel, pixel2, weight);
  } else {
    return getPixelFilter(image, texelSize, interpolate, uv);
  }
}

bool raster_has_values(vec4 pixel) {
  if (imageUnscale[0] < imageUnscale[1]) {
    return pixel.a == 1.;
  } else {
    return !isNaN(pixel.x);
  }
}

float raster_get_value(vec4 pixel) {
  float value;
  if (imageTypeVector) {
    if (imageUnscale[0] < imageUnscale[1]) {
      value = length(mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), pixel.xy));
    } else {
      value = length(pixel.xy);
    }
  } else {
    if (imageUnscale[0] < imageUnscale[1]) {
      value = mix(imageUnscale[0], imageUnscale[1], pixel.x);
    } else {
      value = pixel.x;
    }
  }

  return value;
}

float raster_get_palette_value(float value) {
  return unscale(paletteBounds[0], paletteBounds[1], value);
}

float raster_get_direction_value(vec4 pixel) {
  if (imageTypeVector) {
    vec2 value;
    if (imageUnscale[0] < imageUnscale[1]) {
      value = mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), pixel.xy);
    } else {
      value = pixel.xy;
    }

    return mod((360. - (atan2(value.y, value.x) / RASTER_PI * 180. + 180.)) - 270., 360.) / 360.;
  } else {
    return 0.;
  }
}