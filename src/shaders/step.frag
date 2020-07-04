precision mediump float;

#define SHADER_NAME step.frag

#pragma glslify: random = require('glsl-random')
#pragma glslify: _if = require('./_if')
#pragma glslify: linearstep = require('./_linearstep')
#pragma glslify: unpackPosition = require('./_unpack-position')
#pragma glslify: packPosition = require('./_pack-position')
#pragma glslify: transform = require('./_transform')
#pragma glslify: getPositionValues = require('./_get-position-values')
#pragma glslify: hasValues = require('./_has-values')

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

void main() {
    float particleIndex = vTexCoord.y * (uStateResolution.y - 1.0) * uStateResolution.x + vTexCoord.x * (uStateResolution.x - 1.0);

    // read position
    vec4 packedBoundedWorldPosition = texture2D(sState, vTexCoord);

    // unpack position
    vec2 boundedWorldPosition = unpackPosition(packedBoundedWorldPosition);
    vec2 worldPosition = mix(uWorldBoundsMin, uWorldBoundsMax, boundedWorldPosition);

    // update world position, take into account WGS84 distortion
    vec4 values = getPositionValues(sSource, uSourceResolution, worldPosition);
    vec2 speed = mix(vec2(uSourceBoundsMin), vec2(uSourceBoundsMax), values.yz);
    float distortion = cos(radians(worldPosition.y * 180.0 - 90.0)); 
    vec2 distortedSpeed = vec2(speed.x / distortion, -speed.y);
    vec2 offset = distortedSpeed * uSpeedFactor * 0.0001;
    vec2 newWorldPosition = worldPosition + offset;

    // pack position
    vec2 newBoundedWorldPosition = clamp(linearstep(uWorldBoundsMin, uWorldBoundsMax, newWorldPosition), 0.0, 1.0);
    vec4 newPackedBoundedWorldPosition = packPosition(newBoundedWorldPosition);

    // randomize position to prevent converging particles
    // - generate random position with data
    vec2 seed = (worldPosition + vTexCoord) * uRandomSeed;
    vec2 randomBoundedWorldPosition = vec2(random(seed + 1.3), random(seed + 2.1));
    vec2 randomWorldPosition = mix(uWorldBoundsMin, uWorldBoundsMax, randomBoundedWorldPosition);
    vec4 randomWorldPositionValues = getPositionValues(sSource, uSourceResolution, randomWorldPosition);
    vec4 randomPackedBoundedWorldPosition = packPosition(randomBoundedWorldPosition);
    randomPackedBoundedWorldPosition = _if(hasValues(randomWorldPositionValues), randomPackedBoundedWorldPosition, dropPosition);
    // - 1st frame: drop
    bool drop = abs(mod(particleIndex, uDropAge) - uFrameNumber) < 1.0;
    newPackedBoundedWorldPosition = _if(drop, dropPosition, newPackedBoundedWorldPosition);
    // - 2nd frame: randomize
    bool randomize = packedBoundedWorldPosition == dropPosition;
    newPackedBoundedWorldPosition = _if(randomize, randomPackedBoundedWorldPosition, newPackedBoundedWorldPosition);
    
    // write position
    gl_FragColor = newPackedBoundedWorldPosition;
}