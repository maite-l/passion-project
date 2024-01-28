#version 300 es

precision highp float;

out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;

uniform vec3 colourA;
uniform vec3 colourB;
uniform vec3 colourC;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Some useful functions
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0f / 289.0f)) * 289.0f;
}
vec2 mod289(vec2 x) {
    return x - floor(x * (1.0f / 289.0f)) * 289.0f;
}
vec3 permute(vec3 x) {
    return mod289(((x * 34.0f) + 1.0f) * x);
}

//
// Description : GLSL 2D simplex noise function
//      Author : Ian McEwan, Ashima Arts
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License :
//  Copyright (C) 2011 Ashima Arts. All rights reserved.
//  Distributed under the MIT License. See LICENSE file.
//  https://github.com/ashima/webgl-noise
//
float snoise(vec2 v) {

    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187f,
                        // (3.0-sqrt(3.0))/6.0
    0.366025403784439f,
                        // 0.5*(sqrt(3.0)-1.0)
    -0.577350269189626f,
                        // -1.0 + 2.0 * C.x
    0.024390243902439f);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0f);
    i1 = (x0.x > x0.y) ? vec2(1.0f, 0.0f) : vec2(0.0f, 1.0f);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0f, i1.y, 1.0f)) + i.x + vec3(0.0f, i1.x, 1.0f));

    vec3 m = max(0.5f - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0f);

    m = m * m;
    m = m * m;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0f * fract(p * C.www) - 1.0f;
    vec3 h = abs(x) - 0.5f;
    vec3 ox = floor(x + 0.5f);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159f - 0.85373472095314f * (a0 * a0 + h * h);

    // Compute final noise value at P
    vec3 g = vec3(0.0f);
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * vec2(x1.x, x2.x) + h.yz * vec2(x1.y, x2.y);
    return 130.0f * dot(m, g);
}

vec3 gradient(vec3 colourA, vec3 colourB, vec2 st, float size, vec2 offset) {
    st *= size;
    st += offset;
    return mix(colourA, colourB, snoise(st) * .5f + .5f);
}
float stripedPolygon(vec2 st, int sides, float size, vec2 offset, int stripesAmount, float stripeWidth) {
    stripeWidth -= 0.5f;
    st = st * 2.f - 1.f;
    st += offset;
    float a = atan(st.x, st.y) + PI;
    float r = TWO_PI / float(sides);
    float d = cos(floor(.5f + a / r) * r - a) * length(st);
    float shape = 1.0f - smoothstep(size + stripeWidth, size + stripeWidth + 0.1f, fract(d * float(stripesAmount) * 2.f + 0.5f));
    return shape *= 1.0f - smoothstep(size, size + 0.01f, d);
}

float random(float x) {
    return fract(sin(x) * 10000.0f);
}
float noise(float st) {
    return mix(random(floor(st)), random(floor(st) + 1.0f), smoothstep(0.f, 1.f, fract(st)));
}

float box(in vec2 _st, in vec2 _size) {
    _size = vec2(0.5f) - _size * 0.5f;
    vec2 uv = smoothstep(_size, _size + vec2(0.001f), _st);
    uv *= smoothstep(_size, _size + vec2(0.001f), vec2(1.0f) - _st);
    return uv.x * uv.y;
}
mat2 rotate2d(float _angle) {
    return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

vec3 star(vec2 st, vec2 size) {
    vec3 shape = vec3(0.0f);

    for(int i = 0; i < 8; ++i) {
        st -= 0.5f;
        float angle = PI * float(i) / float(8.f);
        st = rotate2d(angle) * st;
        st += 0.5f;
        shape = mix(shape, vec3(1.f), box(st, size));
    }
    return shape;
}

float circle(in vec2 _st, in float _radius) {
    vec2 dist = _st - vec2(0.5f);
    return 1.f - smoothstep(_radius - (_radius * 0.01f), _radius + (_radius * 0.01f), dot(dist, dist) * 4.0f);
}

float thickness(float u_time) {
    return max(0.005f, (sin(u_time / 1.5f)) / 10.f);
}
void main() {

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;
    st.x -= 0.35f;

    vec3 colour = vec3(0.0f);

    vec3 stripes = vec3(0.0f);
    for(int i = 10; i <= 12; ++i) {
        vec2 offsetShape = (vec2(random(floor(u_time) / 2.f + float(i)), random(floor(u_time) / 2.f + float(i) + 1.f)) - 0.5f);
        vec2 offsetGradient = (vec2(noise((u_time) * 1.5f - 1.f), noise((u_time) * 1.5f - 2.f)));

        vec3 gradient = gradient(colourA, vec3(0.1f, 0.1f, 0.f), st, 2.f, offsetGradient);
        float shape = stripedPolygon(st, 2, 0.2f, offsetShape, 8, 0.8f);

        stripes += (vec3(shape) * gradient) / 2.f;
    }
    colour += mix(colour, stripes, 1.f);

    vec2 placement1 = vec2(-0.15f, -0.15f) + (noise(u_time) * 2.f - 1.f) / 100.f;
    vec2 st1 = st + placement1;
    st1 -= 0.5f;
    st1 = rotate2d(cos(u_time)) * st1;
    st1 += 0.5f;
    vec3 gradient1 = gradient(colourA, vec3(0.1f), st, 2.f, vec2(noise((u_time) * 1.5f), noise((u_time) * 1.5f - 1.f)));
    vec3 shape1 = star(st1, vec2(1.f, thickness(u_time)));
    shape1 *= circle(st1, 0.2f);
    colour += mix(colour, shape1 * gradient1, 1.f);

    vec2 placement2 = vec2(0.15f, 0.f) + (noise(u_time + 2.f) * 2.f - 1.f) / 100.f;
    ;
    vec2 st2 = st + placement2;
    st2 -= 0.5f;
    st2 = rotate2d(-cos(u_time + 2.f)) * st2;
    st2 += 0.5f;
    vec3 gradient2 = gradient(colourB, vec3(0.1f), st, 2.f, vec2(noise((u_time) * 1.5f + 1.f), noise((u_time) * 1.5f + 2.f)));
    vec3 shape2 = star(st2, vec2(1.f, thickness(u_time + 3.f)));
    shape2 *= circle(st2, 0.2f);
    colour += mix(colour, shape2 * gradient2, 1.f);

    vec2 placement3 = vec2(-0.1f, 0.15f) + (noise(u_time + 3.f) * 2.f - 1.f) / 100.f;
    ;
    vec2 st3 = st + placement3;
    st3 -= 0.5f;
    st3 = rotate2d(-cos(u_time + 3.f)) * st3;
    st3 += 0.5f;
    vec3 gradient3 = gradient(colourC, vec3(0.1f), st, 2.f, vec2(noise((u_time) * 1.5f + 3.f), noise((u_time) * 1.5f + 4.f)));
    vec3 shape3 = star(st3, vec2(1.f, thickness(u_time + 5.f)));
    shape3 *= circle(st3, 0.2f);
    colour += mix(colour, shape3 * gradient3, 1.f);

    outColor += vec4(colour, 1.0f);
}