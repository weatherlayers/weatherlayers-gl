precision mediump float;

#define SHADER_NAME overlay.vert

attribute vec2 aPosition;
uniform mat4 uMatrix;
uniform float uWorldOffset;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aPosition;
    gl_Position = uMatrix * vec4(aPosition + vec2(uWorldOffset, 0), 0, 1);
}