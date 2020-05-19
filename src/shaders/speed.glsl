/**
 * @param {sampler2D} texture - speed vector texture, <min,max> [m/s] packed as <0,1>
 * @param {float} min - min speed [m/s]
 * @param {float} max - max speed [m/s]
 * @param {vec2} position - position <0,1> to get the speed at
 * @return {vec2} speed [m/s]
 */
vec2 getSpeed(sampler2D texture, float min, float max, vec2 position) {
    vec2 packedSpeed = texture2D(texture, position).rg;

    float delta = max - min;
    vec2 speed = min + packedSpeed * delta;

    return speed;
}

#pragma glslify: export(getSpeed)