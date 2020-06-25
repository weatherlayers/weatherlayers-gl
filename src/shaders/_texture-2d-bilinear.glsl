// manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 texture2DBilinear(sampler2D texture, vec2 resolution, vec2 position) {
    vec2 px = 1.0 / resolution;
    vec2 floorPosition = (floor(position * resolution)) * px;
    vec2 fractPosition = fract(position * resolution);
    vec4 topLeft = texture2D(texture, floorPosition);
    vec4 topRight = texture2D(texture, floorPosition + vec2(px.x, 0));
    vec4 bottomLeft = texture2D(texture, floorPosition + vec2(0, px.y));
    vec4 bottomRight = texture2D(texture, floorPosition + px);
    return mix(mix(topLeft, topRight, fractPosition.x), mix(bottomLeft, bottomRight, fractPosition.x), fractPosition.y);
}

#pragma glslify: export(texture2DBilinear)