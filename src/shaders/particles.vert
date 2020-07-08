precision mediump float;

#define SHADER_NAME particles.vert

#pragma glslify: random = require('glsl-random')
#pragma glslify: _if = require('./_if')
#pragma glslify: transform = require('./_transform')
#pragma glslify: unpackPosition = require('./_unpack-position')

attribute float aIndex;
uniform sampler2D sState0;
uniform sampler2D sState1;
uniform vec2 uStateResolution;
uniform float uParticleSize;
uniform bool uParticleWaves;
uniform mat4 uMatrix;
uniform vec2 uWorldBoundsMin;
uniform vec2 uWorldBoundsMax;
uniform vec2 uPixelSize;

const vec4 dropPosition = vec4(0);

void main() {
    float vertexCount = 4.0;
    float particleIndex = floor(aIndex / vertexCount);
    int vertexIndex = int(fract(aIndex / vertexCount) * vertexCount);

    vec2 texCoord = vec2(
        fract(particleIndex / uStateResolution.x),
        floor(particleIndex / uStateResolution.x) / uStateResolution.y
    );

    vec4 packedBoundedWorldPosition0 = texture2D(sState0, texCoord);
    vec4 packedBoundedWorldPosition1 = texture2D(sState1, texCoord);

    // don't render path for randomized particle
    packedBoundedWorldPosition0 = _if(packedBoundedWorldPosition0 == dropPosition, packedBoundedWorldPosition1, packedBoundedWorldPosition0);
    packedBoundedWorldPosition1 = _if(packedBoundedWorldPosition1 == dropPosition, packedBoundedWorldPosition0, packedBoundedWorldPosition1);

    vec2 boundedWorldPosition0 = unpackPosition(packedBoundedWorldPosition0);
    vec2 boundedWorldPosition1 = unpackPosition(packedBoundedWorldPosition1);

    vec2 worldPosition0 = mix(uWorldBoundsMin, uWorldBoundsMax, boundedWorldPosition0);
    vec2 worldPosition1 = mix(uWorldBoundsMin, uWorldBoundsMax, boundedWorldPosition1);

    vec2 position0 = transform(worldPosition0, uMatrix);
    vec2 position1 = transform(worldPosition1, uMatrix);
    
    // don't render path across for particle that wrapped across the world
    position1 = _if(length(position1 - position0) > 0.5, position0, position1);

    vec2 dirF = position1 - position0;
    vec2 dirFN = _if(length(dirF) > 0.0, normalize(dirF), vec2(1, 0)); // forward direction
    vec2 dirRN = vec2(dirFN.y, -dirFN.x); // perpendicular direction

    vec2 position = _if(
        vertexIndex == 0 || vertexIndex == 1,
        position0, // left (source)
        position1  // right (target)
    );
    vec2 offsetDir = _if(
        vertexIndex == 0 || vertexIndex == 1,
        -dirFN, // left (source)
        dirFN   // right (target)
    ) + _if(
        vertexIndex == 0 || vertexIndex == 2,
        -dirRN, // top
        dirRN   // bottom
    ) * _if(
        uParticleWaves,
        5.0, // line perpendicular to the direction
        1.0  // square
    );
    vec2 offset = vec2(uParticleSize / 2.0, uParticleSize / 2.0) * _if(position0 == position1, 0.0, 1.0);
    position += offsetDir * offset * uPixelSize;

    gl_Position = vec4(position, 0, 1);
}