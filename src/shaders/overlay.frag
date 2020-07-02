precision mediump float;

#define SHADER_NAME overlay.frag
#define EPSILON 0.00001

#pragma glslify: _if = require('./_if')
#pragma glslify: transform = require('./_transform')
#pragma glslify: mercatorToWGS84 = require('./_mercator-to-wgs84')
#pragma glslify: getPositionValues = require('./_get-position-values')
#pragma glslify: hasValues = require('./_has-values')

uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform sampler2D sOverlayColorRamp;
uniform float uOverlayOpacity;

varying vec2 vTexCoord;

void main() {
    vec2 position = mercatorToWGS84(vTexCoord);
    vec4 values = getPositionValues(sSource, uSourceResolution, position);

    vec4 color = texture2D(sOverlayColorRamp, vec2(values.x, 0.0));
    color = _if(hasValues(values), color, vec4(0));

    gl_FragColor = vec4(color.rgb, uOverlayOpacity);
}