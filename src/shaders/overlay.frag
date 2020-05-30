precision mediump float;

#define SHADER_NAME overlay.frag
#define EPSILON 0.00001
#define SHOW_GRID false
#define GRID_SIZE 8.0
#define SHOW_ORIGINAL false

#pragma glslify: transform = require('./_transform')
#pragma glslify: mercatorToWGS84 = require('./_mercator-to-wgs84')
#pragma glslify: getSpeed = require('./_speed')
#pragma glslify: windSpeedColor = require('./_color')

uniform mat4 uOffsetInverse;
uniform sampler2D sWeather;
uniform vec2 uWeatherResolution;
uniform float uWeatherMin;
uniform float uWeatherMax;
uniform float uOverlayOpacity;

varying vec2 vTexCoord;

void main() {
    if (SHOW_GRID) {
        if (fract((gl_FragCoord.x - 0.5) / GRID_SIZE) < EPSILON && fract((gl_FragCoord.y - 0.5) / GRID_SIZE) < EPSILON) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            return;
        }
    }

    vec2 globalWGS84 = mercatorToWGS84(vTexCoord);
    vec2 localWGS84 = transform(globalWGS84, uOffsetInverse);
    vec2 speed = getSpeed(sWeather, uWeatherResolution, localWGS84, uWeatherMin, uWeatherMax);
    vec4 color = windSpeedColor(length(speed), uOverlayOpacity);

    if (SHOW_ORIGINAL) {
        color = texture2D(sWeather, vTexCoord);
    }

    gl_FragColor = color;
}