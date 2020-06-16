precision mediump float;

#define SHADER_NAME overlay.frag
#define EPSILON 0.00001

#pragma glslify: _if = require('./_if')
#pragma glslify: transform = require('./_transform')
#pragma glslify: mercatorToWGS84 = require('./_mercator-to-wgs84')
#pragma glslify: getPositionValues = require('./_get-position-values')

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
    vec2 position = mercatorToWGS84(vTexCoord);

    vec2 values = getPositionValues(sSource, uSourceResolution, position, uSourceBoundsMin, uSourceBoundsMax);
    float value = _if(uSourceBoundsMin.y == 0.0 && uSourceBoundsMax.y == 0.0, values.x, length(values));

    float colorIndex = (value - uOverlayBoundsMin) / (uOverlayBoundsMax - uOverlayBoundsMin);
    vec2 colorPosition = vec2(colorIndex, 0.0);
    vec4 color = vec4(texture2D(sOverlayColorRamp, colorPosition).rgb, uOverlayOpacity);

    gl_FragColor = color;
}