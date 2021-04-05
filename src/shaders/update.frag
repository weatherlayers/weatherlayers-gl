precision highp float;

#define SHADER_NAME update.frag

#pragma glslify: random = require('glsl-random')
#pragma glslify: _if = require('./_if')
#pragma glslify: linearstep = require('./_linearstep')
#pragma glslify: unpackPosition = require('./_unpack-position')
#pragma glslify: packPosition = require('./_pack-position')
#pragma glslify: transform = require('./_transform')
#pragma glslify: mercatorToWGS84 = require('./_mercator-to-wgs84')
#pragma glslify: getPositionValues = require('./_get-position-values')
#pragma glslify: hasValues = require('./_has-values')

uniform sampler2D sState;
uniform vec2 uStateResolution;
uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform vec2 uWorldBoundsMin;
uniform vec2 uWorldBoundsMax;
uniform float uSpeedFactor;
uniform float uMaxAge;
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

    // update position, take into account WGS84 distortion
    vec2 geographicPosition = mercatorToWGS84(worldPosition);
    vec4 values = getPositionValues(sSource, uSourceResolution, geographicPosition);
    vec2 speed = values.yz;
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
    vec2 randomGeographicPosition = mercatorToWGS84(randomWorldPosition);
    vec4 randomWorldPositionValues = getPositionValues(sSource, uSourceResolution, randomGeographicPosition);
    vec4 randomPackedBoundedWorldPosition = packPosition(randomBoundedWorldPosition);
    randomPackedBoundedWorldPosition = _if(hasValues(randomWorldPositionValues), randomPackedBoundedWorldPosition, dropPosition);
    // - 1st frame: drop
    bool drop = !hasValues(values) || abs(mod(particleIndex, uMaxAge + 2.0) - uFrameNumber) < 1.0; // +2 because only non-randomized pairs are rendered
    newPackedBoundedWorldPosition = _if(drop, dropPosition, newPackedBoundedWorldPosition);
    // - 2nd frame: randomize
    bool randomize = packedBoundedWorldPosition == dropPosition;
    newPackedBoundedWorldPosition = _if(randomize, randomPackedBoundedWorldPosition, newPackedBoundedWorldPosition);
    
    // write position
    gl_FragColor = newPackedBoundedWorldPosition;
}