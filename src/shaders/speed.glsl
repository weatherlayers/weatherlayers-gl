/**
 * @param {sampler2D} texture - speed texture, <min,max> packed as <0,1>
 * @param {float} min - min speed value, [m/s]
 * @param {float} max - max speed value, [m/s]
 * @param {vec2} position - position to get speed at, <0,1>
 */
vec2 getSpeed(sampler2D texture, float min, float max, vec2 position) {
    vec2 packedSpeed = texture2D(texture, position).rg;

    float delta = max - min;
    vec2 speed = min + packedSpeed * delta;

    return speed;
}

#pragma glslify: export(getSpeed)