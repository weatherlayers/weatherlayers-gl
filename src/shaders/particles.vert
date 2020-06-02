precision mediump float;

#define SHADER_NAME particles.vert
#define EPSILON 0.00001
#define RANDOM_DIST_THRESHOLD 0.05

#pragma glslify: _if = require('./_if')
#pragma glslify: transform = require('./_transform')
#pragma glslify: unpackPosition = require('./_unpack-position')
#pragma glslify: wgs84ToMercator = require('./_wgs84-to-mercator')

attribute float aIndex;
uniform sampler2D sState0;
uniform sampler2D sState1;
uniform vec2 uStateResolution;
uniform float uParticleSize;
uniform mat4 uMatrix;
uniform vec2 uPixelSize;

void main() {
    float vertexCount = 4.0;
    float particleIndex = floor(aIndex / vertexCount);
    int vertexIndex = int(fract(aIndex / vertexCount) * vertexCount);

    vec2 texCoord = vec2(
        fract(particleIndex / uStateResolution.x),
        floor(particleIndex / uStateResolution.x) / uStateResolution.y
    );

    vec4 packedPosition0 = texture2D(sState0, texCoord);
    vec4 packedPosition1 = texture2D(sState1, texCoord);

    vec2 position0 = unpackPosition(packedPosition0);
    vec2 position1 = unpackPosition(packedPosition1);

    vec2 dirF = position1 - position0; // forward direction
    vec2 dirFN = normalize(dirF);
    vec2 dirRN = vec2(dirFN.y, -dirFN.x); // perpendicular direction
    float dist = length(dirF);

    vec2 position = _if(
        vertexIndex == 0 || vertexIndex == 1,
        position0, // left (source)
        position1  // right (target)
    );
    position = _if(
        dist > RANDOM_DIST_THRESHOLD,
        position0, // don't render path for randomized particle
        position
    );

    position = wgs84ToMercator(position);

    vec2 offsetDir = _if(
        vertexIndex == 0 || vertexIndex == 1,
        -1.0, // left (source)
        1.0   // right (target)
    ) * dirFN + _if(
        vertexIndex == 0 || vertexIndex == 2,
        -1.0, // top
        1.0   // bottom
    ) * dirRN;

    vec2 offset = vec2(uParticleSize / 2.0, uParticleSize / 2.0);
    position += offsetDir * offset * uPixelSize;

    gl_Position = uMatrix * vec4(position, 0, 1);
    // gl_Position = vec4(2.0 * position.x - 1.0, 1.0 - 2.0 * position.y, 0, 1);
}