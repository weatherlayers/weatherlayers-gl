uniform sampler2D bitmapTexture2;
uniform vec2 imageResolution;
uniform bool imageInterpolate;
uniform float imageWeight;
uniform bool imageTypeVector;
uniform vec2 imageUnscale;
uniform float interval;
uniform vec4 color;
uniform float width;
uniform float rasterOpacity;

bool isNaN(float value) {
  return !(value <= 0. || 0. <= value);
}

// texture2D with software bilinear filtering
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 texture2DBilinear(sampler2D image, vec2 resolution, vec2 uv) {
  vec2 texelSize = 1. / resolution;

  // Calculate pixels to sample and interpolating factor
  uv -= texelSize * 0.5;
  vec2 factor = fract(uv * resolution);

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

vec4 texture2DFilter(sampler2D image, vec2 resolution, bool interpolate, vec2 uv) {
  vec2 texelSize = 1. / resolution;

  // Offset (test case: Gibraltar)
  uv += texelSize * 0.5;

  if (interpolate) {
    return texture2DBilinear(image, resolution, uv);
  } else {
    return texture2D(image, uv);
  }
}

bool raster_has_values(vec4 values) {
  if (imageUnscale[0] < imageUnscale[1]) {
    return values.a == 1.;
  } else {
    return !isNaN(values.x);
  }
}

float raster_get_value(vec4 color) {
  float value;
  if (imageTypeVector) {
    if (imageUnscale[0] < imageUnscale[1]) {
      value = length(mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), color.xy));
    } else {
      value = length(color.xy);
    }
  } else {
    if (imageUnscale[0] < imageUnscale[1]) {
      value = mix(imageUnscale[0], imageUnscale[1], color.x);
    } else {
      value = color.x;
    }
  }

  return value;
}

vec4 raster_apply_opacity(vec3 color, float alpha) {
  return mix(vec4(0.), vec4(color, 1.), alpha);
}