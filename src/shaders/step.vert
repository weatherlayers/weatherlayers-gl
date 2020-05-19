attribute vec2 aPosition;
varying vec2 vTexCoord; // <0,1>

void main() {
    vTexCoord = (aPosition + 1.0) / 2.0;
    gl_Position = vec4(aPosition, 1, 1);
}