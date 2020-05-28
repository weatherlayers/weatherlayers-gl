precision mediump float;

#define SHADER_NAME quad.vert

attribute vec2 aPosition;
varying vec2 vTexCoord;

void main() {
    vTexCoord = vec2(aPosition.x, 1.0 - aPosition.y);
    gl_Position = vec4(2.0 * aPosition.x - 1.0, 1.0 - 2.0 * aPosition.y, 0, 1);
}