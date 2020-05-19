precision highp float;

#define SHOW_GRID false
#define GRID_SIZE 8.0
#define SHOW_ORIGINAL false

#pragma glslify: getSpeed = require('./speed')
#pragma glslify: windColor = require('./color-schemas')

uniform sampler2D sWeather;
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

    vec4 color;
    if (SHOW_ORIGINAL) {
        color = texture2D(sWeather, vTexCoord);
    } else {
        vec2 speed = getSpeed(sWeather, uWeatherMin, uWeatherMax, vTexCoord);
        color = windColor(length(speed), 0.4);
    }

    gl_FragColor = color;
}