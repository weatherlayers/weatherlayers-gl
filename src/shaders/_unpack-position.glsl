vec2 unpackPosition(vec4 packedPosition) {
    // float texture
    return packedPosition.ra;

    // return vec2(
    //     packedPosition.r / 255.0 + packedPosition.b,
    //     packedPosition.g / 255.0 + packedPosition.a
    // );
}

#pragma glslify: export(unpackPosition)