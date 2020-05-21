precision mediump float;

uniform sampler2D sScreen;
uniform float uFadeOpacity;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(sScreen, 1.0 - vTexCoord);

    // a hack to guarantee opacity fade out even with a value close to 1.0
    vec4 newColor = vec4(floor(255.0 * color * uFadeOpacity) / 255.0);

    gl_FragColor = newColor;
}