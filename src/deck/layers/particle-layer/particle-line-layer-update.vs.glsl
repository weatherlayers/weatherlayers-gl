#version 300 es
#define SHADER_NAME particle-line-layer-update-vertex-shader

#ifdef GL_ES
precision highp float;
#endif

@include "../../_utils/pixel.glsl"
@include "../../_utils/pixel-value.glsl"

in vec3 sourcePosition;
in vec4 sourceColor;
out vec3 targetPosition;
out vec4 targetColor;

const float DROP_POSITION_Z = -1.;
const vec4 HIDE_COLOR = vec4(0);

const float _EARTH_RADIUS = 6370972.0; // meters

// see https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js#L360
vec2 destinationPoint(vec2 from, float dist, float bearing) {
  float d = dist / _EARTH_RADIUS;
  float r = radians(bearing);

  float y1 = radians(from.y);
  float x1 = radians(from.x);

  float siny2 = sin(y1) * cos(d) + cos(y1) * sin(d) * cos(r);
  float y2 = asin(siny2);
  float y = sin(r) * sin(d) * cos(y1);
  float x = cos(d) - sin(y1) * siny2;
  float x2 = x1 + atan2(y, x);

  float lat = degrees(y2);
  float lon = degrees(x2);

  return vec2(lon, lat);
}

// longitude wrapping allows rendering in a repeated MapView
float wrapLongitude(float lng) {
  float wrappedLng = mod(lng + 180., 360.) - 180.;
  return wrappedLng;
}

float wrapLongitude(float lng, float minLng) {
  float wrappedLng = wrapLongitude(lng);
  if (wrappedLng < minLng) {
    wrappedLng += 360.;
  }
  return wrappedLng;
}

float randFloat(vec2 seed) {
  return fract(sin(dot(seed.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 randPoint(vec2 seed) {
  return vec2(randFloat(seed + 1.3), randFloat(seed + 2.1));
}

vec2 randPointToPosition(vec2 point) {
  if (particle.viewportGlobe == 1.) {
    point.x += 0.0001; // prevent generating point in the center
    point.x = sqrt(point.x); // uniform random distance, see https://twitter.com/keenanisalive/status/1529490555893428226
    float dist = point.x * particle.viewportGlobeRadius;
    float bearing = point.y * 360.;
    return destinationPoint(particle.viewportGlobeCenter, dist, bearing);
  } else {
    point.y = smoothstep(0., 1., point.y); // uniform random latitude
    vec2 viewportBoundsMin = particle.viewportBounds.xy;
    vec2 viewportBoundsMax = particle.viewportBounds.zw;
    return mix(viewportBoundsMin, viewportBoundsMax, point);
  }
}

vec2 movePositionBySpeed(vec2 position, vec2 speed) {
  // float dist = sqrt(speed.x * speed.x + speed.y + speed.y) * 10000.;
  // float bearing = degrees(-atan2(speed.y, speed.x));
  // targetPosition.xy = destinationPoint(position.xy, dist, bearing);
  float distortion = cos(radians(position.y));

  vec2 offset;
  if (particle.viewportGlobe == 1.) {
    offset = vec2(speed.x / distortion, speed.y); // faster longitude
  } else {
    offset = vec2(speed.x, speed.y * distortion); // slower latitude
  }

  return position + offset;
}

bool isPositionInBounds(vec2 position, vec4 bounds) {
  vec2 boundsMin = bounds.xy;
  vec2 boundsMax = bounds.zw;
  float lng = wrapLongitude(position.x, boundsMin.x);
  float lat = position.y;
  return (
    boundsMin.x <= lng && lng <= boundsMax.x &&
    boundsMin.y <= lat && lat <= boundsMax.y
  );
}

void main() {
  float particleIndex = mod(float(gl_VertexID), particle.numParticles);
  float particleAge = floor(float(gl_VertexID) / particle.numParticles);

  // update particles age0
  // older particles age1-age(N-1) are copied with buffer.copyData
  if (particleAge > 0.) {
    return;
  }

  if (sourcePosition.z == DROP_POSITION_Z) {
    // generate random position to prevent converging particles
    vec2 particleSeed = vec2(particleIndex * particle.seed / particle.numParticles);
    vec2 point = randPoint(particleSeed);
    vec2 position = randPointToPosition(point);
    targetPosition.xy = position;
    targetPosition.x = wrapLongitude(targetPosition.x);
    targetColor = HIDE_COLOR;
    return;
  }

  if (particle.viewportZoomChangeFactor > 1. && mod(particleIndex, particle.viewportZoomChangeFactor) >= 1.) {
    // drop when zooming out
    targetPosition.xy = sourcePosition.xy;
    targetPosition.z = DROP_POSITION_Z;
    targetColor = HIDE_COLOR;
    return;
  }

  if (abs(mod(particleIndex, particle.maxAge + 2.) - mod(particle.time, particle.maxAge + 2.)) < 1.) {
    // drop by maxAge, +2 because only non-randomized pairs are rendered
    targetPosition.xy = sourcePosition.xy;
    targetPosition.z = DROP_POSITION_Z;
    targetColor = HIDE_COLOR;
    return;
  }

  if (!isPositionInBounds(sourcePosition.xy, bitmap2.bounds)) {
    // drop out of bounds
    targetPosition.xy = sourcePosition.xy;
    targetColor = HIDE_COLOR;
    return;
  }

  vec2 uv = getUV(sourcePosition.xy); // imageTexture is in COORDINATE_SYSTEM.LNGLAT, no coordinate conversion needed
  vec4 pixel = getPixelSmoothInterpolate(imageTexture, imageTexture2, raster.imageResolution, raster.imageSmoothing, raster.imageInterpolation, raster.imageWeight, bitmap2.isRepeatBounds, uv);
  if (!hasPixelValue(pixel, raster.imageUnscale)) {
    // drop nodata
    targetPosition.xy = sourcePosition.xy;
    targetColor = HIDE_COLOR;
    return;
  }

  float value = getPixelMagnitudeValue(pixel, raster.imageType, raster.imageUnscale);
  if (
    (!isNaN(raster.imageMinValue) && value < raster.imageMinValue) ||
    (!isNaN(raster.imageMaxValue) && value > raster.imageMaxValue)
  ) {
    // drop value out of bounds
    targetPosition.xy = sourcePosition.xy;
    targetColor = HIDE_COLOR;
    return;
  }

  // update position
  vec2 speed = getPixelVectorValue(pixel, raster.imageType, raster.imageUnscale) * particle.speedFactor;
  targetPosition.xy = movePositionBySpeed(sourcePosition.xy, speed);
  targetPosition.x = wrapLongitude(targetPosition.x);

  // update color
  targetColor = sourceColor; // dummy use so that sourceColor attribute is detected by shader layout introspection in WEBGLRenderPipeline
  targetColor = applyPalette(paletteTexture, palette.paletteBounds, palette.paletteColor, value);
}