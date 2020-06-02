float _if(bool condition, float trueResult, float falseResult) {
    return mix(falseResult, trueResult, float(condition));
}

vec2 _if(bool condition, vec2 trueResult, vec2 falseResult) {
    return mix(falseResult, trueResult, float(condition));
}

#pragma glslify: export(_if)