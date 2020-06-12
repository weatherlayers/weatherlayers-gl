precision mediump float;

#define SHADER_NAME particles.vert
#define EPSILON 0.00001

#pragma glslify: random = require('glsl-random')
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
uniform float uWorldOffset;
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

    vec2 position0 = packedPosition0.rg;
    vec2 position1 = packedPosition1.rg;

    vec2 dropPosition = vec2(0, 0);
    position0 = _if(
        position0 == dropPosition,
        position1, // don't render path for randomized particle
        position0
    );
    position1 = _if(
        position1 == dropPosition,
        position0, // don't render path for randomized particle
        position1
    );

    position0 = wgs84ToMercator(position0);
    position1 = wgs84ToMercator(position1);
    position0 = transform(position0 + vec2(uWorldOffset, 0), uMatrix);
    position1 = transform(position1 + vec2(uWorldOffset, 0), uMatrix);
    
    position1 = _if(
        length(position1 - position0) > 0.5,
        position0, // don't render path across for particle that wrapped across the world
        position1
    );

    vec2 dirF = position1 - position0;
    vec2 dirFN = _if(
        length(dirF) > 0.0,
        normalize(dirF), // forward direction
        vec2(1, 0)
    );
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
    );
    vec2 offset = vec2(uParticleSize / 2.0, uParticleSize / 2.0);
    position += offsetDir * offset * uPixelSize;

    // gl_Position = uMatrix * vec4(position, 0, 1);
    gl_Position = vec4(position, 0, 1);
    // gl_Position = vec4(2.0 * position.x - 1.0, 1.0 - 2.0 * position.y, 0, 1);
}