#version 300 es

precision highp float;

uniform vec3 u_resolution;
uniform float u_time;

out vec4 outColor;


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

float circle(in vec2 _st, in float _radius) {
    vec2 dist = _st - vec2(0.5f);
    return 1.f - smoothstep(_radius - (_radius * 0.01f), _radius + (_radius * 0.01f), dot(dist, dist) * 4.0f);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    // st.x -= 0.25f;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 color = vec3(0.f);

    vec2 pos = vec2(st * 25.f);
    float row = step(1.0f, mod(pos.y, 2.0f));
    pos.x += (row * (0.5f));

    vec2 integer = (floor(pos));
    vec2 fractional = fract(pos);
    color = vec3(circle(fractional, (smoothstep(0.0f, 0.99f, snoise(integer / 10.f + u_time / 5.f) * 0.5f + 0.5f))));

    outColor = vec4(color, 1.0f);
}