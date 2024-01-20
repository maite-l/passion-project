#version 300 es

precision highp float;

uniform vec3 u_resolution;
uniform float u_time;

out vec4 outColor;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;
    outColor = vec4(st.y, 0.f, st.x, 1.0f);
}