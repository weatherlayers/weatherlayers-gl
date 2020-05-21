precision mediump float;

#pragma glslify: random = require('glsl-random')
#pragma glslify: getSpeed = require('./_speed')

uniform sampler2D sState;
uniform sampler2D sWeather;
uniform vec2 uWeatherResolution;
uniform float uWeatherMin;
uniform float uWeatherMax;
uniform float uSpeedFactor;
uniform float uDropRate;
uniform float uDropRateBump;
uniform float uRandomSeed;
varying vec2 vTexCoord;

void main() {
    vec4 packedPosition = texture2D(sState, vTexCoord);

    // unpack the position from RGBA
    vec2 position = vec2(
        packedPosition.r / 255.0 + packedPosition.b,
        packedPosition.g / 255.0 + packedPosition.a
    );

    // move the position, take into account the distortion
    vec2 speed = getSpeed(sWeather, uWeatherResolution, position, uWeatherMin, uWeatherMax);
    float distortion = cos(radians(position.y * 180.0 - 90.0));
    vec2 offset = vec2(speed.x / distortion, -speed.y) * 0.0001 * uSpeedFactor;
    vec2 newPosition = fract(position + offset + 1.0);

    // randomize the position to prevent particles from converging to the areas of low pressure
    vec2 seed = (position + vTexCoord) * uRandomSeed;
    float dropRate = uDropRate + length(speed) / length(vec2(uWeatherMax, uWeatherMax)) * uDropRateBump;
    float drop = step(1.0 - dropRate, random(seed));
    vec2 randomPosition = vec2(random(seed + 1.3), random(seed + 2.1));
    newPosition = mix(newPosition, randomPosition, drop);

    // pack position back into RGBA
    vec4 newPackedPosition = vec4(
        fract(newPosition * 255.0),
        floor(newPosition * 255.0) / 255.0
    );

    gl_FragColor = newPackedPosition;
}