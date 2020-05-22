precision mediump float;

attribute float aIndex;
uniform sampler2D sState;
uniform vec2 uStateResolution;
uniform vec2 uScreenResolution;
uniform float uParticleSize;

void main() {
    vec2 texCoord = vec2(
        fract(aIndex / uStateResolution.x),
        floor(aIndex / uStateResolution.x) / uStateResolution.y
    );

    vec4 packedPosition = texture2D(sState, texCoord);

    vec2 position = vec2(
        packedPosition.r / 255.0 + packedPosition.b,
        packedPosition.g / 255.0 + packedPosition.a
    );

    gl_PointSize = uParticleSize;
    gl_Position = vec4(2.0 * position.x - 1.0, 1.0 - 2.0 * position.y, 0, 1);
}