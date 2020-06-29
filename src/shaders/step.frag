precision mediump float;

#define SHADER_NAME step.frag
#define EPSILON 0.00001

#pragma glslify: random = require('glsl-random')
#pragma glslify: _if = require('./_if')
#pragma glslify: linearstep = require('./_linearstep')
#pragma glslify: unpackPosition = require('./_unpack-position')
#pragma glslify: packPosition = require('./_pack-position')
#pragma glslify: transform = require('./_transform')
#pragma glslify: getPositionValues = require('./_get-position-values')

uniform sampler2D sState;
uniform vec2 uStateResolution;
uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform float uSourceBoundsMin;
uniform float uSourceBoundsMax;
uniform vec2 uWorldBoundsMin;
uniform vec2 uWorldBoundsMax;
uniform float uSpeedFactor;
uniform float uDropAge;
uniform float uFrameNumber;
uniform float uRandomSeed;
varying vec2 vTexCoord;

const vec4 dropPosition = vec4(0);

vec2 updateWorldPosition(vec2 worldPosition) {
    vec4 values = getPositionValues(sSource, uSourceResolution, worldPosition);
    vec2 speed = mix(vec2(uSourceBoundsMin), vec2(uSourceBoundsMax), values.yz);

    // take into account WGS84 distortion
    float distortion = cos(radians(worldPosition.y * 180.0 - 90.0)); 
    vec2 distortedSpeed = vec2(speed.x / distortion, -speed.y);

    vec2 offset = distortedSpeed * uSpeedFactor * 0.0001;
    vec2 newWorldPosition = worldPosition + offset;

    return newWorldPosition;
}

void main() {
    float particleIndex = vTexCoord.y * (uStateResolution.y - 1.0) * uStateResolution.x + vTexCoord.x * (uStateResolution.x - 1.0);
    
    vec4 packedBoundedWorldPosition = texture2D(sState, vTexCoord);
    vec2 boundedWorldPosition = unpackPosition(packedBoundedWorldPosition);
    vec2 worldPosition = mix(uWorldBoundsMin, uWorldBoundsMax, boundedWorldPosition);

    vec2 newWorldPosition = updateWorldPosition(worldPosition);
    vec2 newBoundedWorldPosition = clamp(linearstep(uWorldBoundsMin, uWorldBoundsMax, newWorldPosition), 0.0, 1.0);

    // randomize the position to prevent converging particles
    // 2nd frame: randomize
    vec2 seed = (worldPosition + vTexCoord) * uRandomSeed;
    vec2 randomBoundedWorldPosition = vec2(random(seed + 1.3), random(seed + 2.1));
    bool randomize = packedBoundedWorldPosition == dropPosition;
    newBoundedWorldPosition = _if(randomize, randomBoundedWorldPosition, newBoundedWorldPosition);

    vec4 newPackedBoundedWorldPosition = packPosition(newBoundedWorldPosition);

    // randomize the position to prevent converging particles
    // 1st frame: drop
    bool drop = abs(mod(particleIndex, uDropAge) - uFrameNumber) < 1.0;
    newPackedBoundedWorldPosition = _if(drop, dropPosition, newPackedBoundedWorldPosition);
    
    gl_FragColor = newPackedBoundedWorldPosition;
}