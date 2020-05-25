vec2 unpackPosition(vec4 packedPosition) {
    return packedPosition.rg / 255.0 + packedPosition.ba;
}

#pragma glslify: export(unpackPosition)