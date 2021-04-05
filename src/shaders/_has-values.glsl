// see https://stackoverflow.com/questions/9446888/best-way-to-detect-nans-in-opengl-shaders
bool isnan(float val) {
    return (val < 0.0 || 0.0 < val || val == 0.0) ? false : true;
}

bool hasValues(vec4 values) {
    return !isnan(values.r);
}

#pragma glslify: export(hasValues)