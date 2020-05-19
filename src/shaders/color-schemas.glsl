#define M_PI 3.1415926535897932384626433832795

vec4 sinebowColor(float hue, float a) {
    // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
    // hue == 1 from mapping to the same color.
    float rad = hue * 2.0 * M_PI * 5.0 / 6.0;
    rad *= 0.75; // increase frequency to 2/3 cycle per rad

    float s = sin(rad);
    float c = cos(rad);
    float r = max(0.0, -c);
    float g = max(s, 0.0);
    float b = max(max(c, 0.0), -s);
    return vec4(r, g, b, a);
}

vec4 interpolateColor(vec4 start, vec4 end, float i, float a) {
    return vec4(
        start.r + i * (end.r - start.r),
        start.g + i * (end.g - start.g),
        start.b + i * (end.b - start.b),
        a
    );
}

vec4 fadeToWhite(float i, float a) {
    return interpolateColor(sinebowColor(1.0, 0.0), vec4(1.0, 1.0, 1.0, 1.0), i, a);
}

vec4 extendedSinebowColor(float i, float a) {
    float BOUNDARY = 0.45;
    return i <= BOUNDARY ?
        sinebowColor(i / BOUNDARY, a) :
        fadeToWhite((i - BOUNDARY) / (1.0 - BOUNDARY), a);
}

vec4 windColor(float speed, float a) {
    return extendedSinebowColor(min(speed, 100.0) / 100.0, a);
}

#pragma glslify: export(windColor)