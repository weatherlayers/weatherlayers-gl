precision mediump float;

uniform sampler2D sScreen;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(sScreen, 1.0 - vTexCoord);

    gl_FragColor = color;
}