precision highp float;

#pragma glslify: getSpeed = require('./speed')

uniform sampler2D sState;
uniform sampler2D sWeather;
uniform vec2 uWeatherResolution;
uniform float uWeatherMin;
uniform float uWeatherMax;
uniform float uSpeedFactor;
varying vec2 vTexCoord;

void main() {
    vec4 packedPosition = texture2D(sState, vTexCoord);

    // unpack the position from RGBA
    vec2 position = vec2(
        packedPosition.r / 255.0 + packedPosition.b,
        packedPosition.g / 255.0 + packedPosition.a
    );

    // move the position
    vec2 speed = getSpeed(sWeather, uWeatherResolution, position, uWeatherMin, uWeatherMax);
    float distortion = cos(radians(position.y * 180.0 - 90.0));
    vec2 offset = vec2(speed.x / distortion, -speed.y) * 0.0001 * uSpeedFactor;
    vec2 newPosition = fract(position + offset + 1.0);

    // pack position back into RGBA
    vec4 newPackedPosition = vec4(
        fract(newPosition * 255.0),
        floor(newPosition * 255.0) / 255.0
    );

    gl_FragColor = newPackedPosition;
}