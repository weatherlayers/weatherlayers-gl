#pragma glslify: texture2DBilinear = require('./_texture-2d-bilinear')

vec4 getPositionValues(sampler2D texture, vec2 resolution, vec2 position) {
    // project from world position to texture position
    vec2 texturePosition = position;

    vec2 wrappedTexturePosition = vec2(fract(texturePosition.x), texturePosition.y);

    // vec4 values = texture2D(texture, wrappedTexturePosition); // lower-res hardware linear filtering
    vec4 values = texture2DBilinear(texture, resolution, wrappedTexturePosition);

    return values;
}

#pragma glslify: export(getPositionValues)