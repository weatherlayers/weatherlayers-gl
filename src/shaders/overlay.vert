precision mediump float;

#define SHADER_NAME overlay.vert

attribute vec2 aPosition;
uniform mat4 uMatrix;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aPosition;
    gl_Position = uMatrix * vec4(aPosition, 0, 1);
}