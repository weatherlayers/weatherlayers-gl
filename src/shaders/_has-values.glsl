#pragma glslify: texture2DBilinear = require('./_texture-2d-bilinear')

bool hasValues(vec4 values) {
    return values.a != 0.0;
}

#pragma glslify: export(hasValues)