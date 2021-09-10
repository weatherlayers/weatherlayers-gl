/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export default `\
#version 300 es
#define SHADER_NAME particle-layer-update-transform-vertex-shader

precision highp float;

in vec3 sourcePosition;
out vec3 targetPosition;

uniform sampler2D bitmapTexture;
uniform sampler2D bitmapTexture2;
uniform float imageWeight;
uniform float imageUnscale;
uniform vec2 imageBounds;
uniform vec4 bounds;

uniform float numParticles;
uniform float maxAge;
uniform float speedFactor;

uniform float viewportSphere;
uniform vec2 viewportSphereCenter;
uniform float viewportSphereRadius;
uniform vec4 viewportBounds;
uniform float zoomChangeFactor;

uniform float time;
uniform float seed;

const vec2 DROP_POSITION = vec2(0);

// no coordinate conversion needed
vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bounds[0]) / (bounds[2] - bounds[0]),
    (pos.y - bounds[3]) / (bounds[1] - bounds[3])
  );
}

// see https://stackoverflow.com/a/27228836/1823988
float atan2(float y, float x) {
  return x == 0. ? sign(y) * PI / 2. : atan(y, x);
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

bool isNan(float value) {
  return (value <= 0.0 || 0.0 <= value) ? false : true;
}

bool hasValues(vec4 values) {
  return !isNan(values.x) && !isNan(values.y) && values.a == 1.0;
}

vec2 getSpeed(vec4 color) {
  if (imageUnscale > 0.5) {
    return mix(vec2(imageBounds[0]), vec2(imageBounds[1]), color.xy);
  } else {
    return color.xy;
  }
}

float wrap(float lng) {
  float wrappedLng = mod(lng + 180., 360.) - 180.;
  return wrappedLng;
}

float wrap(float lng, float minLng) {
  float wrappedLng = wrap(lng);
  if (wrappedLng < minLng) {
    wrappedLng += 360.;
  }
  return wrappedLng;
}

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 randVec2(vec2 seed) {
  return vec2(rand(seed + 1.3), rand(seed + 2.1));
}

vec2 randPosition(vec2 seed) {
  vec2 randomVec2 = randVec2(seed);
  
  if (viewportSphere > 0.5) {
    randomVec2.x += 0.0001; // prevent generating point in the center
    float dist = sqrt(randomVec2.x) * viewportSphereRadius;
    float bearing = randomVec2.y * 360.;
    return destinationPoint(viewportSphereCenter, dist, bearing);
  } else {
    vec2 viewportBoundsMin = viewportBounds.xy;
    vec2 viewportBoundsMax = viewportBounds.zw;
    return mix(viewportBoundsMin, viewportBoundsMax, randomVec2);
  }
}

bool isPositionVisible(vec2 position) {
  if (viewportSphere > 0.5) {
    return distanceTo(viewportSphereCenter, position) <= viewportSphereRadius;
  } else {
    vec2 viewportBoundsMin = viewportBounds.xy;
    vec2 viewportBoundsMax = viewportBounds.zw;
    float lng = wrap(position.x, viewportBoundsMin.x);
    float lat = position.y;
    return (
      viewportBoundsMin.x <= lng && lng <= viewportBoundsMax.x &&
      viewportBoundsMin.y <= lat && lat <= viewportBoundsMax.y
    );
  }
}

void main() {
  float particleIndex = mod(float(gl_VertexID), numParticles);
  float particleAge = floor(float(gl_VertexID) / numParticles);

  if (sourcePosition.xy != DROP_POSITION) {
    // update position
    vec2 uv = getUV(sourcePosition.xy);
    vec4 bitmapColor = texture2D(bitmapTexture, uv);
    if (imageWeight > 0.) {
      bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), imageWeight);
    }
    vec2 speed = getSpeed(bitmapColor);

    // float dist = sqrt(speed.x * speed.x + speed.y + speed.y) * speedFactor * 10000.;
    // float bearing = degrees(-atan2(speed.y, speed.x));
    // targetPosition.xy = destinationPoint(sourcePosition.xy, dist, bearing);
    float distortion = cos(radians(sourcePosition.y)); 
    vec2 distortedSpeed = vec2(speed.x / distortion, speed.y);
    vec2 offset = distortedSpeed * speedFactor;
    targetPosition.xy = sourcePosition.xy + offset;
    targetPosition.x = wrap(targetPosition.x);

    // drop nodata
    if (!hasValues(bitmapColor)) {
      targetPosition.xy = DROP_POSITION;
    }

    // drop out of bounds
    if (!isPositionVisible(sourcePosition.xy) || !isPositionVisible(targetPosition.xy)) {
      targetPosition.xy = DROP_POSITION;
    }

    // drop when zooming out
    if (zoomChangeFactor > 1. && mod(particleIndex, zoomChangeFactor) >= 1.) {
      targetPosition.xy = DROP_POSITION;
    }

    if (particleAge < 1.) {
      // drop by maxAge, +2 because only non-randomized pairs are rendered
      if (abs(mod(particleIndex, maxAge + 2.) - mod(time, maxAge + 2.)) < 1.) {
        targetPosition.xy = DROP_POSITION;
      }
    }
  } else {
    if (particleAge < 1.) {
      // generate random position to prevent converging particles
      vec2 randomSeed = vec2(particleIndex * seed / numParticles);
      vec2 randomPosition = randPosition(randomSeed);
      targetPosition.xy = randomPosition;
      targetPosition.x = wrap(targetPosition.x);
    } else {
      targetPosition.xy = DROP_POSITION;
    }
  }
}
`;