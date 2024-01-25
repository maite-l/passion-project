

const canvas = document.querySelector('#c');
canvas.width = 600; canvas.height = 600;
const gl = canvas.getContext('webgl2');

const createProgram = (gl, vs, fs) => {
    const program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    return program;
}


const vertexShader1Source =
    `#version 300 es

precision highp float;

in vec2 a_position;

void main() {
    gl_Position = vec4(a_position, 0, 1);
}
`;
const fragmentShader1Source = `#version 300 es

precision highp float;

out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265359

float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size, _size+vec2(0.05), _st);
    uv *= smoothstep(_size, _size+vec2(0.05), vec2(1.0)-_st);
    return uv.x*uv.y;
}

vec2 rotate2D (vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

void main() {

    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.);

    vec2 border = vec2(4.,6.);
    float columns = 23.;
    float rows = 16.;
    vec2 zoom = vec2(columns+border.x,rows+border.y);
    vec2 size = vec2(0.3, 1.);

    float offsetX = 1. / zoom.x * border.x/2.;
    float offsetY = 1. / zoom.y * border.y/2.;

    vec2 bl = step(vec2(offsetX,offsetY),st);
	vec2 tr = step(vec2(offsetX,offsetY),1.0-st);
    color += vec3((bl.x * bl.y * tr.x * tr.y));

    st.y = 1. - st.y;
    st *= zoom;

    vec2 ipos = floor(st);
    vec2 fpos = fract(st);

    st = fpos;

    float cellIndex = (ipos.y+((ipos.x)*zoom.x));

    float phi = (cellIndex/2. / (columns*rows)) * PI;
	float theta = (sin(phi) * PI * 0.720 + u_time * 0.1);

    st = rotate2D(st, theta);

    float width = (abs(cos(phi))*0.4 + 0.1);

    vec3 grid;
    grid = vec3(box(st, vec2(width, 2.)))*vec3(1.);

    color *= grid;
    color *= mix(color, vec3(0.77,0.52,1.), grid);

    outColor = vec4(color, 1.0);
}
`;


const program1 = createProgram(gl, vertexShader1Source, fragmentShader1Source);

const program1data = new Float32Array([
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,

    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0,
]);

const program1VAO = gl.createVertexArray();
gl.bindVertexArray(program1VAO);

const u_timeLocation1 = gl.getUniformLocation(program1, "u_time");
const u_resolutionLocation1 = gl.getUniformLocation(program1, "u_resolution");

const program1Buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, program1Buffer);
gl.bufferData(gl.ARRAY_BUFFER, program1data, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
gl.enableVertexAttribArray(0);

gl.bindVertexArray(null);



const fragColourTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);

gl.bindTexture(gl.TEXTURE_2D, null);


const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fragColourTexture, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);


const vertexShader2Source = `#version 300 es

precision highp float;

in vec2 a_position;

out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0., 1.);
    v_texCoord = a_position.xy * 0.5 + 0.5;
}
`;
const fragmentShader2Source = `#version 300 es

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

uniform sampler2D u_texture;
in vec2 v_texCoord;

out vec4 outColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

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
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

float random (float x) {
    return fract(sin(x)*10000.0);
}
float noise(float st) {
    return mix(random(floor(st)), random(floor(st) + 1.0), smoothstep(0.,1.,fract(st)));
}

void main() {
    vec4 color = texture(u_texture, v_texCoord);

    float dustIntensity = 0.15;
    float noiseValue1 = snoise(v_texCoord * 40.0 + vec2((noise(floor((u_time*3.7)))), v_texCoord * 40.0 + vec2(noise(floor((-u_time*2.)-10.)))));
    float noiseValue2 = snoise(v_texCoord * 42.0 + vec2(noise(floor((-u_time*2.6)+80.)), v_texCoord * 42.0 + vec2(noise(floor((u_time*5.)+50.)))));
    float noiseValue = step(noiseValue1 * noiseValue2, 1.-dustIntensity);
    float dustEffect = 1. - noiseValue;
    vec3 dustColor = vec3(1., 0.2, 0.3);
    color = mix(color, vec4(dustColor, 0.5), dustEffect);

    outColor = color;
}
`;

const program2 = createProgram(gl, vertexShader2Source, fragmentShader2Source);

const program2data = new Float32Array([
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,

    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0
]);


const program2VAO = gl.createVertexArray();
gl.bindVertexArray(program2VAO);

const u_timeLocation2 = gl.getUniformLocation(program2, "u_time");
const u_resolutionLocation2 = gl.getUniformLocation(program2, "u_resolution");

const program2Buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, program2Buffer);
gl.bufferData(gl.ARRAY_BUFFER, program2data, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
gl.enableVertexAttribArray(0);

gl.bindVertexArray(null);



const animate = (time = 0) => {

    gl.useProgram(program1);
    gl.uniform1f(u_timeLocation1, time / 1000);
    gl.uniform2f(u_resolutionLocation1, canvas.width, canvas.height);
    gl.bindVertexArray(program1VAO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(program2);
    gl.uniform1f(u_timeLocation2, time / 1000);
    gl.uniform2f(u_resolutionLocation2, canvas.width, canvas.height);
    gl.bindVertexArray(program2VAO);
    gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);

    requestAnimationFrame(animate);
}
animate();

