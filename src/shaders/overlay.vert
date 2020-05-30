precision mediump float;

#define SHADER_NAME overlay.vert
#pragma glslify: transform = require('./_transform')
#pragma glslify: wgs84ToMercator = require('./_wgs84-to-mercator')

attribute vec2 aPosition;
uniform mat4 uOffset;
uniform mat4 uMatrix;
varying vec2 vTexCoord;

void main() {
    vec2 worldCoordsWGS84 = transform(aPosition, uOffset);
    vec2 worldCoordsMerc = wgs84ToMercator(worldCoordsWGS84);
    vTexCoord = worldCoordsMerc;
    gl_Position = uMatrix * vec4(worldCoordsMerc, 0, 1);
    
    vTexCoord = aPosition;
    gl_Position = uMatrix * vec4(aPosition, 0, 1);
}