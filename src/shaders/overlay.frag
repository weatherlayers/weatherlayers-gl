precision highp float;

#define SHOW_GRID false
#define GRID_SIZE 8.0

#pragma glslify: windColor = require('./color-schemas')

uniform sampler2D sImage;
uniform float uMin;
uniform float uMax;

varying vec2 vTexCoord;

void main() {
    if (SHOW_GRID) {
        if (fract((gl_FragCoord.x - 0.5) / GRID_SIZE) < 0.00001 && fract((gl_FragCoord.y - 0.5) / GRID_SIZE) < 0.00001) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            return;
        }
    }

    float delta = uMax - uMin;
    vec2 textureVector = texture2D(sImage, vTexCoord).rg;
    vec2 speedVector = uMin + textureVector * delta;
    float speed = length(speedVector);
    vec4 color = windColor(speed);
    gl_FragColor = color;
}