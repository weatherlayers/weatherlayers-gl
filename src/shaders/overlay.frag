precision highp float;

#define SHADER_NAME overlay.frag

#pragma glslify: _if = require('./_if')
#pragma glslify: transform = require('./_transform')
#pragma glslify: getPositionValues = require('./_get-position-values')
#pragma glslify: hasValues = require('./_has-values')

uniform sampler2D sSource;
uniform vec2 uSourceResolution;
uniform sampler2D sOverlayColorRamp;
uniform float uOverlayOpacity;

varying vec2 vTexCoord;

void main() {
    vec2 worldPosition = vTexCoord;

    vec4 values = getPositionValues(sSource, uSourceResolution, worldPosition);

    vec4 color = texture2D(sOverlayColorRamp, vec2(values.x, 0.0));
    color = vec4(color.rgb, uOverlayOpacity);
    color = _if(hasValues(values), color, vec4(0));

    gl_FragColor = color;
}