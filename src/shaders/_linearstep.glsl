// smoothstep without smoothing
// see https://stackoverflow.com/a/34602425/1823988

vec2 linearstep(vec2 edge0, vec2 edge1, vec2 x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

#pragma glslify: export(linearstep)