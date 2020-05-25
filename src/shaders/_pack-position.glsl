vec4 packPosition(vec2 position) {
    return vec4(fract(position * 255.0), floor(position * 255.0) / 255.0);
}

#pragma glslify: export(packPosition)