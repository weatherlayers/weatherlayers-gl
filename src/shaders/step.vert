precision mediump float;

attribute vec2 aPosition;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aPosition;
    gl_Position = vec4(1.0 - 2.0 * aPosition, 0, 1);
}