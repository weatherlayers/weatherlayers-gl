vec4 packPosition(vec2 position) {
    // float texture
    return vec4(position, 0, 0);

    // return vec4(
    //     fract(position * 255.0),
    //     floor(position * 255.0) / 255.0
    // );
}

#pragma glslify: export(packPosition)