#version 300 es

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

uniform sampler2D u_texture;
in vec2 v_texCoord;

out vec4 outColor;

#define BLOOM_BLEND_AMOUNT 64.
#define BLOOM_INTENSITY 6.

#define GRAIN_INTENSITY 0.15

#define DUST_AMOUNT 0.15

#define SHAKE_INTENSITY 0.002

#define ABBERATION_INTENSITY 0.001

#define LINES_AMOUNT 150.
#define LINES_INTENSITY 0.1

// --- NOISE AND RANDOM FUNCTIONS ---

float random(float x) {
    return fract(sin(x) * 10000.0f);
}
float noise(float st) {
    return mix(random(floor(st)), random(floor(st) + 1.0f), smoothstep(0.f, 1.f, fract(st)));
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

// --- BLOOM HELPER FUNCTIONS 

float luma(vec4 col) {
    return (col.r + col.g + col.b) / 3.f;
}

vec4 textureB(sampler2D sampler, vec2 uv) {
    vec4 col = texture(sampler, uv);
    col *= step(0.4f, luma(col));
    return col;
}

// --- BLOOM FUNCTION

vec4 bloom(vec2 uv) {
    float blurDist = 0.1f;
    float halfBlurIters = BLOOM_BLEND_AMOUNT;

    float blurStep = blurDist / halfBlurIters;

    vec4 col1 = vec4(0.f);
    vec4 col2 = vec4(0.f);

    vec2 uX = vec2(1, 0);
    vec2 uY = vec2(0, 1);

    for(float i = 0.f; i < halfBlurIters; i++) {
        float offset = blurStep * (i - halfBlurIters / 2.f);
        //col1 += textureB(u_texture, uv + (uX * offset) - (uY * offset/3.));  // DIAGONAL BLUR INSTAD OF HORIZONTAL
        col1 += textureB(u_texture, uv + (uX * offset));
    }

    col1 /= halfBlurIters / BLOOM_INTENSITY;

    for(float i = 0.f; i < halfBlurIters; i++) {
        float offset = blurStep * (i - halfBlurIters / 2.f);
        //col2 += textureB(u_texture, uv - (uX * offset/3.) + (uY * offset));  // DIAGONAL BLUR INSTAD OF VERICAL
        col2 += textureB(u_texture, uv + (uY * offset));
    }

    col2 /= halfBlurIters / BLOOM_INTENSITY;

    return (col1 + col2) / 12.f;
}

// --- GRAIN FUNCTION

float grain(vec2 st) {
    float noise = fract(sin(dot(st.xy, vec2(12.9898f, 78.233f))) * 43758.5453123f + (u_time * 2.f));
    return noise * GRAIN_INTENSITY;
}

// --- DUST FUNCTION

vec4 dust(vec2 uv, vec4 color) {
    float noiseValue1 = snoise(uv * 40.0f + vec2((noise(floor((u_time * 3.7f)))), uv * 40.0f + vec2(noise(floor((-u_time * 2.f) - 10.f)))));
    float noiseValue2 = snoise(uv * 42.0f + vec2(noise(floor((-u_time * 2.6f) + 80.f)), uv * 42.0f + vec2(noise(floor((u_time * 5.f) + 50.f)))));
    float noiseValue = step(noiseValue1 * noiseValue2, 1.f - DUST_AMOUNT);
    float dustEffect = 1.f - noiseValue;
    vec3 dustColor = vec3(1.f, 0.2f, 0.3f);
    color = mix(color, vec4(dustColor, 0.5f), dustEffect);
    return color;
}

// --- SHAKE FUNCTION

vec2 shake(vec2 uv) {
    uv *= 0.98f;
    uv += 0.01f;
    uv *= 1.f + noise(floor(u_time * 0.5f)) * SHAKE_INTENSITY;
    uv.x += noise(floor(u_time * 3.f)) * SHAKE_INTENSITY;
    uv.y += noise(floor((u_time + 1.f) * 3.f)) * SHAKE_INTENSITY;
    return uv;
}

// --- ABBERATION FUNCTION

vec4 abberation(vec2 uv, vec4 color) {
    float aberration = random(floor(u_time) + abs(atan(u_time) * 0.001f)) * ABBERATION_INTENSITY;
    color.r = texture(u_texture, uv + vec2(aberration, -aberration)).r;
    color.b = texture(u_texture, uv - vec2(aberration, -aberration)).b;
    return color;
}

// --- PIXELATION FUNCTION

vec2 pixelate(vec2 uv) {
    float pixels = 800.f;
    float dx = (u_resolution.x / pixels) * (1.0f / pixels);
    float dy = (u_resolution.y / pixels) * (1.0f / pixels);
    uv = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
    return uv;
}

// --- LINES FUNCTION

float lines(vec2 uv) {
    float scaledUv = (v_texCoord.y) * LINES_AMOUNT;
    scaledUv += sin(floor(u_time * 2.2f) / 5.f);
    float lines = (step(0.6f, fract(scaledUv)));
    lines = 1.f - lines * LINES_INTENSITY;
    return lines;
}

void main() {
    vec2 uv = v_texCoord;
    // uv.x *= u_resolution.x / u_resolution.y;

    uv = shake(uv);

    // uv = pixelate(uv);

    vec4 color = texture(u_texture, uv);

    color *= lines(uv);

    color = abberation(uv, color);

    color += bloom(uv);

    color += grain(uv);

    color = dust(uv, color);

    outColor = color;
}