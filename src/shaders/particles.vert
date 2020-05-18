attribute float aIndex;
uniform sampler2D sState0; // current particle state, xy = x, zw = y
uniform sampler2D sState1; // last particle state, xy = x, zw = y
uniform vec2 uStateDimensions;

void main() {
    vec2 positionCoord = vec2(fract(aIndex / uStateDimensions.x), floor(aIndex / uStateDimensions.x) / uStateDimensions.y);

    vec4 packedPosition0 = texture2D(sState0, positionCoord);
    vec4 packedPosition1 = texture2D(sState1, positionCoord);

    vec2 position0 = fract(packedPosition0.rg / 255.5 + packedPosition0.ba); // current particle position
    vec2 position1 = fract(packedPosition1.rg / 255.5 + packedPosition1.ba); // last particle position

    gl_PointSize = 1.0;
    gl_Position = vec4(position0 * 2.0 - 1.0, 0, 1);
}