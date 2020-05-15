attribute vec2 aPosition;
uniform mat3 uMatrix;
varying vec2 vTexCoord;

void main() {
    gl_Position = vec4(uMatrix * vec3(aPosition, 1), 1);
    vTexCoord = aPosition;
}