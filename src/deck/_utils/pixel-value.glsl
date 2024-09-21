// see https://stackoverflow.com/a/27228836/1823988
float atan2(float y, float x) {
  return x == 0. ? sign(y) * _PI / 2. : atan(y, x);
}

// see https://github.com/tensorflow/tfjs/pull/6107
bool isNaN(float value) {
  uint valueUint = floatBitsToUint(value);
  return (valueUint & 0x7fffffffu) > 0x7f800000u;
}

bool hasPixelValue(vec4 pixel, vec2 imageUnscale) {
  if (imageUnscale[0] < imageUnscale[1]) {
    // pixel.a == 1. may cause incorrect nodata pixels in Safari, because Canvas.getImageData returns different data from the original image, with lower values
    // - this happened in 2023.10.2, fixed in 2023.10.3, reverted in 2024.1.0, it's not happening anymore, why?
    // anything smaller causes interpolated nodata edges with linear interpolation
    // pixel.a >= 1. because sometimes the original value is slightly larger (255.00000000000003)
    return pixel.a >= 1.;
  } else {
    return !isNaN(pixel.x);
  }
}

float getPixelScalarValue(vec4 pixel, float imageType, vec2 imageUnscale) {
  if (imageType == 1.) {
    return 0.;
  } else {
    if (imageUnscale[0] < imageUnscale[1]) {
      return mix(imageUnscale[0], imageUnscale[1], pixel.x);
    } else {
      return pixel.x;
    }
  }
}

vec2 getPixelVectorValue(vec4 pixel, float imageType, vec2 imageUnscale) {
  if (imageType == 1.) {
    if (imageUnscale[0] < imageUnscale[1]) {
      return mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), pixel.xy);
    } else {
      return pixel.xy;
    }
  } else {
    return vec2(0.);
  }
}

float getPixelMagnitudeValue(vec4 pixel, float imageType, vec2 imageUnscale) {
  if (imageType == 1.) {
    vec2 value = getPixelVectorValue(pixel, imageType, imageUnscale);
    return length(value);
  } else {
    return getPixelScalarValue(pixel, imageType, imageUnscale);
  }
}

float getPixelDirectionValue(vec4 pixel, float imageType, vec2 imageUnscale) {
  if (imageType == 1.) {
    vec2 value = getPixelVectorValue(pixel, imageType, imageUnscale);
    return mod((360. - (atan2(value.y, value.x) / _PI * 180. + 180.)) - 270., 360.) / 360.;
  } else {
    return 0.;
  }
}