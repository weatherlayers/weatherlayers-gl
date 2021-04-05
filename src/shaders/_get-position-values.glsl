#pragma glslify: texture2DBilinear = require('./_texture-2d-bilinear')

vec4 getPositionValues(sampler2D texture, vec2 resolution, vec2 position) {
    vec2 wrappedPosition = vec2(fract(position.x), position.y);

    // vec2 values = texture2D(texture, wrappedPosition); // lower-res hardware linear filtering
    vec4 values = texture2DBilinear(texture, resolution, wrappedPosition);

    return values;
}

#pragma glslify: export(getPositionValues)