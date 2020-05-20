precision mediump float;

#define SHOW_GRID false
#define GRID_SIZE 8.0
#define SHOW_ORIGINAL false

#pragma glslify: getSpeed = require('./speed')
#pragma glslify: windSpeedColor = require('./color')

uniform sampler2D sWeather;
uniform vec2 uWeatherResolution;
uniform float uWeatherMin;
uniform float uWeatherMax;

varying vec2 vTexCoord;

void main() {
    if (SHOW_GRID) {
        if (fract((gl_FragCoord.x - 0.5) / GRID_SIZE) < 0.00001 && fract((gl_FragCoord.y - 0.5) / GRID_SIZE) < 0.00001) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            return;
        }
    }

    vec2 speed = getSpeed(sWeather, uWeatherResolution, vTexCoord, uWeatherMin, uWeatherMax);
    vec4 color = windSpeedColor(length(speed), 0.4);

    if (SHOW_ORIGINAL) {
        color = texture2D(sWeather, vTexCoord);
    }

    gl_FragColor = color;
}