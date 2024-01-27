#version 300 es

precision highp float;

in vec2 a_position;

out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.f, 1.f);
    v_texCoord = a_position.xy * 0.5f + 0.5f;
}