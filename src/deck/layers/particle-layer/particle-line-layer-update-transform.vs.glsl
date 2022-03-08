#version 300 es
#define SHADER_NAME particle-layer-update-transform-vertex-shader

precision highp float;

in vec3 sourcePosition;
out vec3 targetPosition;

uniform float viewportSphere;
uniform vec2 viewportSphereCenter;
uniform float viewportSphereRadius;
uniform vec4 viewportBounds;
uniform float viewportZoomChangeFactor;

uniform sampler2D bitmapTexture;
uniform sampler2D bitmapTexture2;
uniform float imageWeight;
uniform vec2 imageUnscale;
uniform vec4 bounds;

uniform float numParticles;
uniform float maxAge;
uniform float speedFactor;

uniform float time;
uniform float seed;

const vec2 DROP_POSITION = vec2(0);

// see https://stackoverflow.com/a/27228836/1823988
float atan2(float y, float x) {
  return x == 0. ? sign(y) * PI / 2. : atan(y, x);
}

bool isNaN(float value) {
  return !(value <= 0. || 0. <= value);
}

// see https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js#L187
float distanceTo(vec2 from, vec2 point) {
  float y1 = radians(from.y);
  float x1 = radians(from.x);
  float y2 = radians(point.y);
  float x2 = radians(point.x);
  float dy = y2 - y1;
  float dx = x2 - x1;

  float a = sin(dy / 2.) * sin(dy / 2.) + cos(y1) * cos(y2) * sin(dx / 2.) * sin(dx / 2.);
  float c = 2. * atan2(sqrt(a), sqrt(1. - a));
  float d = EARTH_RADIUS * c;

  return d;
}

// see https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js#L360
vec2 destinationPoint(vec2 from, float dist, float bearing) {
  float d = dist / EARTH_RADIUS;
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

vec2 pointToPosition(vec2 point) {
  if (viewportSphere > 0.5) {
    point.x += 0.0001; // prevent generating point in the center
    float dist = sqrt(point.x) * viewportSphereRadius;
    float bearing = point.y * 360.;
    return destinationPoint(viewportSphereCenter, dist, bearing);
  } else {
    vec2 viewportBoundsMin = viewportBounds.xy;
    vec2 viewportBoundsMax = viewportBounds.zw;
    return mix(viewportBoundsMin, viewportBoundsMax, point);
  }
}

bool isPositionVisible(vec2 position) {
  if (viewportSphere > 0.5) {
    return distanceTo(viewportSphereCenter, position) <= viewportSphereRadius;
  } else {
    vec2 viewportBoundsMin = viewportBounds.xy;
    vec2 viewportBoundsMax = viewportBounds.zw;
    float lng = wrapLongitude(position.x, viewportBoundsMin.x);
    float lat = position.y;
    return (
      viewportBoundsMin.x <= lng && lng <= viewportBoundsMax.x &&
      viewportBoundsMin.y <= lat && lat <= viewportBoundsMax.y
    );
  }
}

// no coordinate conversion needed
vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bounds[0]) / (bounds[2] - bounds[0]),
    (pos.y - bounds[3]) / (bounds[1] - bounds[3])
  );
}

bool raster_has_values(vec4 values) {
  if (imageUnscale[0] < imageUnscale[1]) {
    return values.a == 1.;
  } else {
    return !isNaN(values.x);
  }
}

vec2 raster_get_values(vec4 color) {
  if (imageUnscale[0] < imageUnscale[1]) {
    return mix(vec2(imageUnscale[0]), vec2(imageUnscale[1]), color.xy);
  } else {
    return color.xy;
  }
}

void main() {
  float particleIndex = mod(float(gl_VertexID), numParticles);
  float particleAge = floor(float(gl_VertexID) / numParticles);

  if (particleAge > 0.) {
    return;
  }

  if (sourcePosition.xy == DROP_POSITION) {
    // generate random position to prevent converging particles
    vec2 particleSeed = vec2(particleIndex * seed / numParticles);
    vec2 point = randPoint(particleSeed);
    vec2 position = pointToPosition(point);
    targetPosition.xy = position;
    targetPosition.x = wrapLongitude(targetPosition.x);
    return;
  }

  if (!isPositionVisible(sourcePosition.xy)) {
    // drop out of bounds
    targetPosition.xy = DROP_POSITION;
    return;
  }

  if (viewportZoomChangeFactor > 1. && mod(particleIndex, viewportZoomChangeFactor) >= 1.) {
    // drop when zooming out
    targetPosition.xy = DROP_POSITION;
    return;
  }

  if (abs(mod(particleIndex, maxAge + 2.) - mod(time, maxAge + 2.)) < 1.) {
    // drop by maxAge, +2 because only non-randomized pairs are rendered
    targetPosition.xy = DROP_POSITION;
    return;
  }

  vec2 uv = getUV(sourcePosition.xy);
  vec4 bitmapColor = texture2D(bitmapTexture, uv);
  if (imageWeight > 0.) {
    bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), imageWeight);
  }

  if (!raster_has_values(bitmapColor)) {
    // drop nodata
    targetPosition.xy = DROP_POSITION;
    return;
  }

  // update position
  vec2 speed = raster_get_values(bitmapColor) * speedFactor;
  // float dist = sqrt(speed.x * speed.x + speed.y + speed.y) * 10000.;
  // float bearing = degrees(-atan2(speed.y, speed.x));
  // targetPosition.xy = destinationPoint(sourcePosition.xy, dist, bearing);
  float distortion = cos(radians(sourcePosition.y)); 
  vec2 offset = vec2(speed.x / distortion, speed.y);
  targetPosition.xy = sourcePosition.xy + offset;
  targetPosition.x = wrapLongitude(targetPosition.x);
}