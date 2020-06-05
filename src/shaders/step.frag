precision mediump float;

#define SHADER_NAME step.frag
#define EPSILON 0.00001
#define STATIC_DIST_THRESHOLD 0.00001

#pragma glslify: random = require('glsl-random')
#pragma glslify: _if = require('./_if')
#pragma glslify: unpackPosition = require('./_unpack-position')
#pragma glslify: packPosition = require('./_pack-position')
#pragma glslify: transform = require('./_transform')
#pragma glslify: getSpeed = require('./_speed')

uniform sampler2D sState;
uniform sampler2D sWeather;
uniform vec2 uWeatherResolution;
uniform float uWeatherMin;
uniform float uWeatherMax;
uniform float uSpeedFactor;
uniform float uDropRate;
uniform float uDropRateBump;
uniform mat4 uMatrix;
uniform mat4 uMatrixInverse;
uniform float uRandomSeed;
varying vec2 vTexCoord;

vec2 update(vec2 position) {
    vec2 seed = (position + vTexCoord) * uRandomSeed;

    // vec2 boundsTL = transform(vec2(0, 0), uMatrixInverse); // 0.5833294886582084, 0.5000076893502499
    // vec2 boundsBL = transform(vec2(0, 1), uMatrixInverse); // 0.5833294886582084, 0.48684352172241446
    // vec2 boundsTR = transform(vec2(1, 0), uMatrixInverse); // 0.6164859669357939, 0.5000076893502499
    // vec2 boundsBR = transform(vec2(1, 1), uMatrixInverse); // 0.6164859669357939, 0.48684352172241446

    // move the position, take into account WGS84 distortion
    vec2 speed = getSpeed(sWeather, uWeatherResolution, position, uWeatherMin, uWeatherMax);
    float distortion = cos(radians(position.y * 180.0 - 90.0));
    vec2 offset = vec2(speed.x / distortion, -speed.y) * 0.0001 * uSpeedFactor;
    vec2 newPosition = vec2(
        fract(position.x + offset.x + 1.0),
        clamp(position.y + offset.y, 0.0, 1.0)
    );

    // randomize the position to prevent particles from converging to the areas of low pressure
    // 1st frame: drop
    float dropRate = uDropRate + length(speed) / length(vec2(uWeatherMax, uWeatherMax)) * uDropRateBump;
    float drop = step(1.0 - dropRate, random(seed));
    drop = _if(
        length(newPosition - position) < STATIC_DIST_THRESHOLD,
        1.0, // drop static particle
        drop
    );
    vec2 dropPosition = vec2(0, 0);
    newPosition = mix(newPosition, dropPosition, drop);

    // 2nd frame: randomize
    vec2 randomPosition = vec2(random(seed + 1.3), random(seed + 2.1));
    // vec2 transformedRandomPosition = transform(randomPosition, uMatrixInverse);
    // vec2 transformedRandomPosition = vec2(
    //     (boundsBL.x - boundsTL.x) * randomPosition.y + (boundsBL.x - boundsTL.x + boundsBR.x - boundsTR.x) * randomPosition.x,
    //     (boundsTR.y - boundsTL.y) * randomPosition.x + (boundsTR.y - boundsTL.y + boundsBR.y - boundsBL.y) * randomPosition.y
    // );
    // newPosition = _if(position == dropPosition, randomPosition, newPosition);
    if (position == dropPosition) {
        newPosition = randomPosition;
    }

    return newPosition;
}

void main() {
    vec4 packedPosition = texture2D(sState, vTexCoord);
    vec2 position = unpackPosition(packedPosition);
    vec2 newPosition = update(position);
    vec4 newPackedPosition = packPosition(newPosition);
    gl_FragColor = newPackedPosition;
}