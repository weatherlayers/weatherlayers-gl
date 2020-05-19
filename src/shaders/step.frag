precision highp float;

uniform sampler2D sState;
varying vec2 vTexCoord; // 0-1

void main() {
    vec4 packedPosition = texture2D(sState, vTexCoord);

    // unpack the position from RGBA
    vec2 position = vec2(packedPosition.r / 255.0 + packedPosition.b, packedPosition.g / 255.0 + packedPosition.a); // 0-1

    // move the position
    vec2 speed = vec2(0.0001, 0.0001); // 0-1
    vec2 newPosition = fract(position + speed); // 0-1

    // pack position back into RGBA
    vec4 newPackedPosition = vec4(fract(newPosition * 255.0), floor(newPosition * 255.0) / 255.0);
    gl_FragColor = newPackedPosition;
}