bool hasValues(vec4 values) {
    return values.a == 255.0;
}

#pragma glslify: export(hasValues)