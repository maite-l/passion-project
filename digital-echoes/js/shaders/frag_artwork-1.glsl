#version 300 es

precision highp float;

out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_contrast;
uniform float u_seed;

float random(in vec2 _st) {
    return fract(sin(dot(_st.xy, vec2(12.9898f, 78.233f))) *
        43758.5453123f);
}

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

vec3 grid(vec2 st, float size, vec2 offset, float threshold) {
    st *= size;
    st += offset;
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);
    vec3 grid = vec3(1.f - step(snoise(ipos), threshold));
    return grid;
}

float circle(in vec2 _st, in float _radius) {
    vec2 dist = _st - vec2(0.5f);
    return 1.f - smoothstep(_radius - (_radius * 0.01f), _radius + (_radius * 0.01f), dot(dist, dist) * 4.0f);
}

vec2 truchetPattern(in vec2 _st, in float _index) {
    _index = fract(((_index - 0.5f) * 2.0f));
    if(_index > 0.80f) {
        _st = vec2(1.0f) - _st;
    } else if(_index > 0.60f) {
        _st = vec2(1.0f - _st.x, _st.y);
    } else if(_index > 0.40f) {
        _st = 1.0f - vec2(1.0f - _st.x, _st.y);
    }
    return _st;
}

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float random(float x) {
    return fract(sin(x) * 10000.0f);
}

#define PI 3.1415926535897932384626433832795

void main() {

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 colour = 1.f - vec3(0.05f, 0.05f, 0.09f);

    vec3 colourA = 1.f - vec3(0.16f, 0.0f, 0.03f);
    vec3 colourB = 1.f - vec3(0.25f, 0.04f, 0.08f);
    vec3 colourC = 1.f - vec3(0.28f, 0.07f, 0.11f);
    vec3 colourD = 1.f - vec3(1.0f, 0.77f, 0.75f);

    vec3 grid1 = grid(st, 10.f, vec2(floor((u_time) / 4.f) + floor(random(u_seed) * 20.f)), 0.3f);
    colour = mix(colour, colourA, grid1);

    vec3 grid2 = grid(st, 5.f, vec2(floor(-u_time / 4.f) + floor(random(u_seed + 2.f) * 10.f)), 0.2f);
    float stripe = step(0.75f, fract((st.x) * 50.f));
    vec3 stripeGrid = grid2 * stripe;
    colour = mix(colour, colourC, stripeGrid);

    vec3 grid3 = grid(st, 20.f, vec2(floor(u_time / 4.f) + floor(random(u_seed + 5.f) * 5.f)), 0.2f);
    colour = mix(colour, colourB, grid3);

    st *= 10.f;
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);
    float circle1 = circle(st, 0.001f);
    colour = mix(colour, vec3(1.f), circle1);

    float skew = ((ipos.y + 1.f) * u_contrast) * 5.f;
    float skewedRandomValue = random(vec2(pow(ipos.x + random(u_seed) / 1000.f, skew), pow(ipos.y + random(u_seed) / 1000.f, skew)));

    if(skewedRandomValue == 0.f) {
        if(random(ipos) > 0.75f) {
            skewedRandomValue = random(ipos);
        }
    }

    vec2 tile = truchetPattern(fpos, skewedRandomValue);

    float pattern;

    if(skewedRandomValue > 0.2f) {
        float curve1 = circle(tile + vec2(0.5f, 0.5f), 1.25f);
        float curve2 = circle(tile + vec2(0.5f, 0.5f), .75f);
        pattern = curve1 - curve2;
    }

    pattern += circle(tile + vec2(0.f, 0.5f), 0.01f);
    pattern += circle(tile + vec2(0.5f, 0.f), 0.01f);

    pattern += circle(tile + vec2(0.f, -0.5f), 0.01f);
    pattern += circle(tile + vec2(-0.5f, 0.f), 0.01f);

    float animatedSize = sin((u_time - 1.f) / 2.f * PI) * 0.9f;
    float scaledAnimatedSize = abs(animatedSize) * 2.0f - 1.0f;

    float mask = circle(tile + vec2(0.2f, 0.2f), max(0.0f, scaledAnimatedSize));
    mask += circle(tile + vec2(-0.3f, -0.7f), max(0.0f, scaledAnimatedSize));
    mask += circle(tile + vec2(-0.7f, 0.3f), max(0.0f, scaledAnimatedSize));

    pattern *= mask;

    colour = mix(colour, colourD, pattern);

    colour = 1.f - colour;

    outColor = vec4(colour, 1.0f);
}