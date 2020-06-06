precision mediump float;

#define SHADER_NAME overlay.frag
#define EPSILON 0.00001
#define SHOW_GRID false
#define GRID_SIZE 8.0
#define SHOW_ORIGINAL false

#pragma glslify: transform = require('./_transform')
#pragma glslify: mercatorToWGS84 = require('./_mercator-to-wgs84')
#pragma glslify: getSpeed = require('./_speed')

uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform vec2 uSourceBoundsMin;
uniform vec2 uSourceBoundsMax;
uniform float uOverlayBoundsMin;
uniform float uOverlayBoundsMax;
uniform sampler2D sOverlayColorRamp;
uniform float uOverlayOpacity;

varying vec2 vTexCoord;

void main() {
    if (SHOW_GRID) {
        if (fract((gl_FragCoord.x - 0.5) / GRID_SIZE) < EPSILON && fract((gl_FragCoord.y - 0.5) / GRID_SIZE) < EPSILON) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            return;
        }
    }

    vec2 position = mercatorToWGS84(vTexCoord);
    vec2 speed = getSpeed(sSource, uSourceResolution, position, uSourceBoundsMin, uSourceBoundsMax);

    float colorIndex = (length(speed) - uOverlayBoundsMin) / (uOverlayBoundsMax - uOverlayBoundsMin);
    vec2 colorPosition = vec2(fract(16.0 * colorIndex), floor(16.0 * colorIndex) / 16.0);
    vec4 color = vec4(texture2D(sOverlayColorRamp, colorPosition).rgb, uOverlayOpacity);

    if (SHOW_ORIGINAL) {
        color = texture2D(sSource, vTexCoord);
    }

    gl_FragColor = color;
}