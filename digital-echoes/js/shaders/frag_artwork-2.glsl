#version 300 es

precision highp float;

out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_motion;
uniform float u_seed;

#define PI 3.14159265359
#define ANIMATION_LENGTH 6.

mat2 rotate2d(float _angle) {
    return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}
mat2 scale2d(vec2 _scale) {
    return mat2(_scale.x, 0.0f, 0.0f, _scale.y);
}

float box(in vec2 _st, in vec2 _size) {
    _size = vec2(0.5f) - _size * 0.5f;
    vec2 uv = smoothstep(_size, _size + vec2(0.005f), _st);
    uv *= smoothstep(_size, _size + vec2(0.005f), vec2(1.0f) - _st);
    return uv.x * uv.y;
}

float easeInOutQuad(float t) {
    return t < 0.5f ? 2.0f * t * t : 1.0f - pow(-2.0f * t + 2.0f, 2.0f) * 0.5f;
}

float widthBox2(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 1.0f) {
        return mix(0.0f, 0.05f, easeInOutQuad(t));
    } else if(t < 2.0f) {
        return mix(0.05f, 0.9f, easeInOutQuad(t - 1.0f));
    } else {
        return 0.9f;
    }
}

float heightBox2(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 1.0f) {
        return mix(0.0f, 0.015f, easeInOutQuad(t));
    } else if(t < 2.0f) {
        return 0.015f;
    } else if(t < 3.0f) {
        return mix(0.015f, 0.9f, easeInOutQuad(t - 2.0f));
    } else {
        return 0.9f;
    }
}

float rotationBox2(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 3.0f) {
        return 4.0f;
    } else if(t < 4.0f) {
        return mix(4.0f, 2.0f, easeInOutQuad(t - 3.0f));
    } else {
        return 2.0f;
    }
}

float stripesWidth(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 4.0f) {
        return 0.75f;
    } else if(t < 5.0f) {
        return mix(0.75f, 0.0f, (t - 4.0f));
    } else {
        return 0.0f;
    }
}

float scaleSt(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 4.0f) {
        return 0.75f;
    } else if(t < 5.0f) {
        return mix(0.75f, 0.0f, (t - 4.0f));
    } else {
        return 0.0f;
    }
}
float mask1Size(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 3.0f) {
        return 0.0f;
    } else {
        return 1.0f;
    }
}

float stScale(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 6.0f) {
        return 1.0f;
    } else {
        return mix(300.0f, 1.0f, easeInOutQuad(t - 5.0f));
    }
}

float box3n4Scale(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    if(t < 5.5f) {
        return 300.0f;
    } else if(t < 6.5f) {
        return mix(2.0f, 1.0f, (t - 4.5f));
    }
}

vec3 stripedBox(vec2 st, float rotation, vec2 size) {
    vec2 stBox = st - vec2(0.5f);
    stBox = rotate2d(rotation) * stBox;
    stBox += vec2(0.5f);

    float stripesBox = step(stripesWidth(u_time), fract((stBox.x) * 10.f));

    vec3 box = vec3(box(stBox, size));
    box *= vec3(stripesBox);
    return box;
}

vec2 rotate(vec2 st, float angle) {
    st -= vec2(0.5f);
    st = rotate2d(angle) * st;
    st += vec2(0.5f);
    return st;
}
vec2 scale(vec2 st, vec2 scale) {
    st -= vec2(0.5f);
    st = scale2d(scale) * st;
    st += vec2(0.5f);
    return st;
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898f, 78.233f))) *
        43758.5453123f);
}

vec3 colourA = vec3(0.05f, 0.2f, 0.2f);
vec3 colourB = vec3(0.95f, 0.f, 0.f);

void main() {

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 colour = colourA;

    float zoom = floor(u_motion * 10.f + 3.f);
    st *= zoom;

    float row = step(1.0f, mod(st.y, 2.0f));
    st.x += (row * (0.5f));

    vec2 index = floor(st);
    st = fract(st);

    float randomXOffset = (random(index + u_seed) * 2.f - 1.f) / 10.f;
    float randomYOffset = (random(index - u_seed) * 2.f - 1.f) / 10.f;
    st += vec2(randomXOffset, randomYOffset);

    float randomTimeOffset = (random(index + 2.f) * 2.f - 1.f) / 10.f;
    float time = u_time + randomTimeOffset + 2.f;

    st = rotate(st, time * PI / 2.f);
    st = scale(st, vec2(0.8f));
    st = scale(st, vec2(stScale(time)));

    vec2 stMask1 = rotate(st, PI / rotationBox2(time));
    vec3 mask1 = vec3(box(stMask1, vec2(mask1Size(time))));

    vec3 stripedBox1 = stripedBox(st, PI / 4.f, vec2(0.6f));

    vec3 maskedStripedBox1 = stripedBox1 * mask1;

    vec3 shape = maskedStripedBox1;

    vec2 stBox2 = rotate(st, PI / rotationBox2(time));
    float stripesBox2 = step(stripesWidth(time), fract((stBox2.x) * 10.f));

    vec3 box2 = vec3(box(stBox2, vec2(float(widthBox2(time)), heightBox2(time))));
    box2 *= vec3(stripesBox2);

    vec2 stMask2 = rotate(st, PI / rotationBox2(time));
    vec3 mask2 = vec3(box(stMask2, vec2(float(0.6f), 0.6f)));

    vec3 stripedBox2 = stripedBox(st, PI / rotationBox2(time), vec2(widthBox2(time), heightBox2(time)));

    vec3 maskedStripedBox2 = stripedBox2 * mask2;

    shape += maskedStripedBox2;
    shape *= colourB;

    colour += shape;

    vec2 stBox3 = rotate(st, PI / 4.f);
    stBox3 = scale(stBox3, vec2(box3n4Scale(time)));
    vec3 box3 = vec3(box(stBox3, vec2(0.5f)));

    vec2 stBox4 = scale(st, vec2(box3n4Scale(time)));
    vec3 box4 = vec3(box(stBox4, vec2(0.5f)));

    vec3 box3n4 = box3 + box4;
    colour = mix(colour, colourA, box3n4);

    outColor = vec4(colour, 1.0f);
}