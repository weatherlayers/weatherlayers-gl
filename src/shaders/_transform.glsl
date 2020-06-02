vec2 transform(vec2 position, mat4 matrix) {
    vec4 transformed = matrix * vec4(position, 0, 1);
    return transformed.xy / transformed.w;
}

#pragma glslify: export(transform)