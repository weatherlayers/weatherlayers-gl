precision mediump float;

#define SHADER_NAME step.frag
#define EPSILON 0.00001
#define STATIC_DIST_THRESHOLD 0.00001

#pragma glslify: random = require('glsl-random')
#pragma glslify: outOfRange = require('glsl-out-of-range')
#pragma glslify: _if = require('./_if')
#pragma glslify: unpackPosition = require('./_unpack-position')
#pragma glslify: packPosition = require('./_pack-position')
#pragma glslify: transform = require('./_transform')
#pragma glslify: getSpeed = require('./_speed')

uniform sampler2D sState;
uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform vec2 uSourceBoundsMin;
uniform vec2 uSourceBoundsMax;
uniform float uSpeedFactor;
uniform float uDropRate;
uniform float uDropRateBump;
uniform vec2 uWorldBoundsMin;
uniform vec2 uWorldBoundsMax;
uniform float uRandomSeed;
varying vec2 vTexCoord;

vec2 offsetWrapped(vec2 position, vec2 offset) {
    return vec2(
        mod(position.x + offset.x, 1.0), // offset and wrap longitude
        clamp(position.y + offset.y, 0.0, 1.0) // offset and clamp latitude
    );
}

vec2 mixWrapped(vec2 boundsMin, vec2 boundsMax, vec2 ratio) {
    return vec2(
        mod(mix(boundsMin.x, boundsMax.x, ratio.x), 1.0), // mix and wrap longitude
        mix(boundsMin.y, boundsMax.y, ratio.y) // mix latitude
    );
}

bool outOfRangeWrapped(vec2 boundsMin, vec2 boundsMax, vec2 position) {
    return
        outOfRange(boundsMin, boundsMax, position) &&
        outOfRange(boundsMin, boundsMax, position + vec2(-1, 0)) &&
        outOfRange(boundsMin, boundsMax, position + vec2(1, 0));
}

vec2 update(vec2 position) {
    vec2 seed = (position + vTexCoord) * uRandomSeed;

    // move the position, take into account WGS84 distortion
    vec2 speed = getSpeed(sSource, uSourceResolution, position, uSourceBoundsMin, uSourceBoundsMax);
    float distortion = cos(radians(position.y * 180.0 - 90.0));
    vec2 offset = vec2(speed.x / distortion, -speed.y) * 0.0001 * uSpeedFactor;
    vec2 newPosition = offsetWrapped(position, offset);

    // randomize the position to prevent particles from converging to the areas of low pressure
    // 1st frame: drop
    float dropRate = uDropRate + length(speed) / length(uSourceBoundsMax) * uDropRateBump;
    float drop = step(1.0 - dropRate, random(seed));
    drop = _if(
        length(newPosition - position) < STATIC_DIST_THRESHOLD * uSpeedFactor,
        1.0, // drop static particle
        drop
    );
    drop = _if(
        outOfRangeWrapped(uWorldBoundsMin, uWorldBoundsMax, position),
        1.0, // drop particle outside of the world bounds
        drop
    );
    vec2 dropPosition = vec2(0, 0);
    newPosition = mix(newPosition, dropPosition, drop);

    // 2nd frame: randomize
    vec2 randomVector = vec2(random(seed + 1.3), random(seed + 2.1));
    vec2 randomPosition = mixWrapped(uWorldBoundsMin, uWorldBoundsMax, randomVector);
    // newPosition = _if(position == dropPosition, randomPosition, newPosition); // why this breaks?
    if (position == dropPosition) {
        newPosition = randomPosition;
    }

    return newPosition;
}

void main() {
    vec4 packedPosition = texture2D(sState, vTexCoord);
    vec2 position = packedPosition.rg;
    vec2 newPosition = update(position);
    vec4 newPackedPosition = vec4(newPosition, 0, 0);
    gl_FragColor = newPackedPosition;
}