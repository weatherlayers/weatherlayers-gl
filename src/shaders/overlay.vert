precision mediump float;

#define SHADER_NAME overlay.vert

attribute vec2 aPosition;
uniform mat3 uMatrix;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aPosition;
    gl_Position = vec4(uMatrix * vec3(aPosition, 1), 1);
}