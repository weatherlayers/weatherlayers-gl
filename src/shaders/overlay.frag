precision highp float;

#define SHADER_NAME overlay.frag

#pragma glslify: _if = require('./_if')
#pragma glslify: transform = require('./_transform')
#pragma glslify: mercatorToWGS84 = require('./_mercator-to-wgs84')
#pragma glslify: getPositionValues = require('./_get-position-values')
#pragma glslify: hasValues = require('./_has-values')

uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform float uSourceBoundsMin;
uniform float uSourceBoundsMax;
uniform sampler2D sOverlayColorRamp;
uniform float uOverlayOpacity;

varying vec2 vTexCoord;

void main() {
    vec2 geographicPosition = mercatorToWGS84(vTexCoord);
    vec4 values = getPositionValues(sSource, uSourceResolution, geographicPosition);
    float value = values.x;

    float colorRampRatio = (value - uSourceBoundsMin) / (uSourceBoundsMax - uSourceBoundsMin);
    vec4 color = texture2D(sOverlayColorRamp, vec2(colorRampRatio, 0.0));
    color = vec4(color.rgb, color.a * uOverlayOpacity);
    color = _if(hasValues(values), color, vec4(0));

    gl_FragColor = color;
}