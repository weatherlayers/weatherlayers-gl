precision mediump float;

#pragma glslify: unpackPosition = require('./_unpack-position')

attribute float aIndex;
uniform sampler2D sState;
uniform vec2 uStateResolution;
uniform vec2 uCanvasResolution;
uniform float uParticleSize;

void main() {
    float vertexCount = 4.0;
    float particleIndex = floor(aIndex / vertexCount);
    int vertexIndex = int(fract(aIndex / vertexCount) * vertexCount);

    vec2 texCoord = vec2(
        fract(particleIndex / uStateResolution.x),
        floor(particleIndex / uStateResolution.x) / uStateResolution.y
    );

    vec4 packedPosition = texture2D(sState, texCoord);

    vec2 position = unpackPosition(packedPosition);

    vec2 pixel = 1.0 / uCanvasResolution;
    if (vertexIndex == 0) {
        // top left
        position += vec2(-uParticleSize / 2.0, -uParticleSize / 2.0) * pixel;
    } else if (vertexIndex == 1) {
        // bottom left
        position += vec2(-uParticleSize / 2.0, uParticleSize / 2.0) * pixel;
    } else if (vertexIndex == 2) {
        // top right
        position += vec2(uParticleSize / 2.0, -uParticleSize / 2.0) * pixel;
    } else {
        // bottom right
        position += vec2(uParticleSize / 2.0, uParticleSize / 2.0) * pixel;
    }

    gl_Position = vec4(2.0 * position.x - 1.0, 1.0 - 2.0 * position.y, 0, 1);
}