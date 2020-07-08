precision mediump float;

#define SHADER_NAME copy.frag

uniform sampler2D sScreen;
uniform float uOpacity;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(sScreen, vTexCoord);

    gl_FragColor = vec4(color.rgb, color.a * uOpacity);
}