precision mediump float;

#define SHADER_NAME fade.frag

uniform sampler2D sScreen;
uniform float uMaxAge;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(sScreen, vTexCoord);

    // a hack to guarantee opacity fade out even with a value close to 1.0
    // vec4 newColor = vec4(color.rgb, floor(255.0 * (color.a - 1.0 / uMaxAge)) / 255.0);
    vec4 newColor = vec4(color.rgb, color.a - 1.0 / uMaxAge);

    gl_FragColor = newColor;
}