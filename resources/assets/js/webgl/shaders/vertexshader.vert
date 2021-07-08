attribute vec3 position;
attribute vec3 secPosition;
attribute vec3 thirdPosition;
attribute float vertexIndex;
attribute float phaseValue;
attribute vec4 randomValue;
uniform float u_switch_01;
uniform float u_switch_02;
uniform float u_switch_03;
uniform float u_animationRange;
uniform float u_particle_animation_range;
uniform float u_time;
uniform float u_op;
uniform float u_particle_range;
uniform float maxOffsetRatio;
uniform float minDurationRatio;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 eyePosition;
varying vec3 vPosition;
varying float vRandomAlpha;

float getVertexAnimationValue(float value) {
    float offsetRatio = randomValue.x * maxOffsetRatio;
    float maxDurationRatio = 1.0 - offsetRatio;
    float durationRatio = maxDurationRatio * (minDurationRatio + (1.0 - minDurationRatio) * randomValue.y);
    float vertexAnimationValue = max(0.0, value - offsetRatio);
    vertexAnimationValue = min(vertexAnimationValue, durationRatio);
    vertexAnimationValue = vertexAnimationValue / durationRatio;
    return vertexAnimationValue;
}

#ifndef PI
#define PI 3.141592653589793
#endif
#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif
float easeInOutBack(float t) {
    float f = t < 0.5
    ? 2.0 * t
    : 1.0 - (2.0 * t - 1.0);
    float g = pow(f, 3.0) - f * sin(f * PI);
    return t < 0.5
    ? 0.5 * g
    : 0.5 * (1.0 - g) + 0.5;
}
float easeInOutElastic(float t) {
    return t < 0.5
    ? 0.5 * sin(+13.0 * HALF_PI * 2.0 * t) * pow(2.0, 10.0 * (2.0 * t - 1.0))
    : 0.5 * sin(-13.0 * HALF_PI * ((2.0 * t - 1.0) + 1.0)) * pow(2.0, -10.0 * (2.0 * t - 1.0)) + 1.0;
}
float easeInOutExpo(float t) {
    return t == 0.0 || t == 1.0
    ? t
    : t < 0.5
      ? +0.5 * pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}

float sineInOut(float t) {
  return -0.5 * (cos(PI * t) - 1.0);
}

void main() {
    vRandomAlpha = randomValue.x + 0.30;

    vec3 firstAnimationPosition = position * sineInOut(getVertexAnimationValue(u_switch_01));
    vec3 secAnimationPosition = secPosition * sineInOut(getVertexAnimationValue(u_switch_02));
    vec3 thirdAnimationPosition = thirdPosition * sineInOut(getVertexAnimationValue(u_switch_03));

    float moveRange = u_particle_range;
    float randX = moveRange * sineInOut(getVertexAnimationValue(sin(u_time + phaseValue)));
    float randY = moveRange * sineInOut(getVertexAnimationValue(cos(u_time + phaseValue)));
    float randZ = randX + randY;

    vec3 loopPosition = (firstAnimationPosition + secAnimationPosition + thirdAnimationPosition) * (1.0 + u_particle_animation_range * sineInOut(getVertexAnimationValue(u_animationRange)));
    float range = 5.0;
    vec3 opPosition = vec3((randomValue.x - 0.5) * range, (randomValue.y - 0.5)  * range, (randomValue.z - 0.5)  * range);
    vec3 allPosition = mix(opPosition, loopPosition, u_op);
    vec3 finalPosition = allPosition + vec3(randX, randY, randZ);
    vPosition = (modelMatrix * vec4(finalPosition, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0 );

    float sizeRange = 2.0 * phaseValue;
    float sizeMoveRange = 20.0;
    gl_PointSize = 20.0 + sizeRange + sizeMoveRange * sineInOut(getVertexAnimationValue(sin(u_time * 2.0 * phaseValue)));
}