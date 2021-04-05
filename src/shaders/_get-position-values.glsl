// manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 texture2DBilinear(sampler2D texture, vec2 resolution, vec2 position) {
    vec2 px = 1.0 / resolution;

    vec2 floorPosition = (floor(position * resolution)) * px;
    vec2 fractPosition = fract(position * resolution);

    vec2 topLeftPosition = floorPosition;
    vec2 topRightPosition = floorPosition + vec2(px.x, 0);
    vec2 bottomLeftPosition = floorPosition + vec2(0, px.y);
    vec2 bottomRightPosition = floorPosition + px;

    vec4 topLeft = texture2D(texture, topLeftPosition);
    vec4 topRight = texture2D(texture, topRightPosition);
    vec4 bottomLeft = texture2D(texture, bottomLeftPosition);
    vec4 bottomRight = texture2D(texture, bottomRightPosition);

    vec4 values = mix(mix(topLeft, topRight, fractPosition.x), mix(bottomLeft, bottomRight, fractPosition.x), fractPosition.y);

    return values;
}

vec4 getPositionValues(sampler2D texture, vec2 resolution, vec2 position) {
    vec2 wrappedPosition = vec2(fract(position.x), position.y);

    // vec2 values = texture2D(texture, wrappedPosition); // lower-res hardware linear filtering
    vec4 values = texture2DBilinear(texture, resolution, wrappedPosition);

    return values;
}

#pragma glslify: export(getPositionValues)