float unscale(float min, float max, float value) {
  return (value - min) / (max - min);
}

// see https://stackoverflow.com/a/27228836/1823988
float atan2(float y, float x) {
  return x == 0. ? sign(y) * PI / 2. : atan(y, x);
}

bool isNaN(float value) {
  return !(value <= 0. || 0. <= value);
}

bool hasPixelValue(vec4 pixel, vec2 imageUnscale) {
  if (imageUnscale[0] < imageUnscale[1]) {
    // pixel.a > 0.5 causes interpolated nodata edges with linear interpolation
    // pixel.a == 1.0 causes incorrect nodata pixels in Safari, because Canvas.getImageData returns different data from the original image, with lower values
    return pixel.a > 0.;
  } else {
    return !isNaN(pixel.x);
  }
}

float getPixelScalarValue(vec4 pixel, bool imageTypeVector, vec2 imageUnscale) {
  if (imageTypeVector) {
    return 0.;
  } else {
    if (imageUnscale[0] < imageUnscale[1]) {
      return mix(imageUnscale[0], imageUnscale[1], pixel.x);
    } else {
      return pixel.x;
    }
  }
}

vec2 getPixelVectorValue(vec4 pixel, bool imageTypeVector, vec2 imageUnscale) {
  if (imageTypeVector) {
    if (imageUnscale[0] < imageUnscale[1]) {
      return mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), pixel.xy);
    } else {
      return pixel.xy;
    }
  } else {
    return vec2(0.);
  }
}

float getPixelMagnitudeValue(vec4 pixel, bool imageTypeVector, vec2 imageUnscale) {
  if (imageTypeVector) {
    vec2 value = getPixelVectorValue(pixel, imageTypeVector, imageUnscale);
    return length(value);
  } else {
    return getPixelScalarValue(pixel, imageTypeVector, imageUnscale);
  }
}

float getPixelDirectionValue(vec4 pixel, bool imageTypeVector, vec2 imageUnscale) {
  if (imageTypeVector) {
    vec2 value = getPixelVectorValue(pixel, imageTypeVector, imageUnscale);
    return mod((360. - (atan2(value.y, value.x) / PI * 180. + 180.)) - 270., 360.) / 360.;
  } else {
    return 0.;
  }
}