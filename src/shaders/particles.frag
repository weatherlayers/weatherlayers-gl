precision mediump float;

#define SHADER_NAME particles.frag

uniform vec4 uParticleColor;

void main() {
    gl_FragColor = uParticleColor;
}