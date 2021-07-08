precision mediump float;

varying vec3 vPosition;
varying float vRandomAlpha;
uniform float fogStart;
uniform float fogEnd;
uniform vec3 fogColor;
uniform vec3 ePosition;
uniform sampler2D u_texture;

void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float len = length(p);
    float alpha = max(1.0 - len, 0.0);

    vec4 texture = texture2D(u_texture, gl_PointCoord);

    float distanceTo = length(vPosition - ePosition);
    float range = fogEnd - fogStart;
    float fogRatio = clamp((distanceTo - fogStart) / range, 0.0, 1.0);
    vec4 finalColor = mix(texture, vec4(fogColor, 1.0), fogRatio);

    gl_FragColor = finalColor * vec4(1.0, 1.0, 1.0, alpha * vRandomAlpha);
}