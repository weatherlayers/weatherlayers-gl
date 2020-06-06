// manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
// see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
vec4 texture2DBilinear(sampler2D texture, vec2 resolution, vec2 position) {
    vec2 px = 1.0 / resolution;
    vec2 vc = (floor(position * resolution)) * px;
    vec2 f = fract(position * resolution);
    vec4 tl = texture2D(texture, vc);
    vec4 tr = texture2D(texture, vc + vec2(px.x, 0));
    vec4 bl = texture2D(texture, vc + vec2(0, px.y));
    vec4 br = texture2D(texture, vc + px);
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

vec2 getSpeed(sampler2D texture, vec2 resolution, vec2 position, vec2 boundsMin, vec2 boundsMax) {
    // vec2 packedSpeed = texture2D(texture, position).rg; // lower-res hardware linear filtering
    vec2 packedSpeed = texture2DBilinear(texture, resolution, position).rg;

    vec2 speed = mix(boundsMin, boundsMax, packedSpeed);

    return speed;
}

#pragma glslify: export(getSpeed)