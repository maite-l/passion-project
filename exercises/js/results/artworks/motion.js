// shader code
const vertexShader1Source = `#version 300 es

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
uniform float u_motion;

#define PI 3.14159265359
#define ANIMATION_LENGTH 6.

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}


float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size,
                        _size+vec2(0.005),
                        _st);
    uv *= smoothstep(_size,
                    _size+vec2(0.005),
                    vec2(1.0)-_st);
    return uv.x*uv.y;
}

float easeInOutQuad(float t) {
    return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) * 0.5;
}


float widthBox2(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 1.0) {
        return result = mix(0.0, 0.05, easeInOutQuad(t));
    } else if (t < 2.0) {
        return result = mix(0.05, 0.9, easeInOutQuad(t - 1.0));
    } else {
        return result = 0.9;
    }
    return result;
}

float heightBox2(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 1.0) {
        return result = mix(0.0, 0.015, easeInOutQuad(t));
    } else if (t < 2.0) {
        return result = 0.015;
    } else if (t < 3.0) {
        return result = mix(0.015, 0.9, easeInOutQuad(t - 2.0));
    } else {
        return result = 0.9;
    }
    return result;
}

float rotationBox2(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 3.0) {
        return result = 4.0;
    } else if (t < 4.0) {
        return result = mix(4.0, 2.0, easeInOutQuad(t - 3.0));
    } else {
        return result = 2.0;
    }
    return result;
}

float stripesWidth(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 4.0) {
        return result = 0.75;
    } else if (t < 5.0) {
        return result = mix(0.75, 0.0, (t - 4.0));
    } else {
        return result = 0.0;
    }
    return result;
}

float scaleSt(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 4.0) {
        return result = 0.75;
    } else if (t < 5.0) {
        return result = mix(0.75, 0.0, (t - 4.0));
    } else {
        return result = 0.0;
    }
    return result;
}
float mask1Size(float time) {
    float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 3.0) {
        return result = 0.0;
    } else {
        return result = 1.0;
    }
    return result;
}

float stScale(float time) {
     float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 6.0) {
        return result = 1.0;
    } else {
        return result = mix(300.0, 1.0, easeInOutQuad(t - 5.0));
    }
    return result;
}

float box3n4Scale(float time) {
     float t = mod(time, ANIMATION_LENGTH);
    float result;
    if (t < 5.5) {
        return result = 300.0;
    } else if (t < 6.5)  {
        return result = mix(3.0, 1.0, (t - 4.5));
    } 
    return result;
}




void main() {

    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 colour = vec3(0.);

    st *= 6.;
    st = fract(st);


    st -= vec2(0.5);
    st = scale( vec2(stScale(u_time)) ) * st;
    st = rotate2d( sin(u_time)*PI/2.) * st;
    st += vec2(0.5);

    vec2 stBox1 = st - vec2(0.5);
    stBox1 = rotate2d( PI/4.) * stBox1;
    stBox1 += vec2(0.5);
    float stripesBox1 = step(stripesWidth(u_time), fract((stBox1.x) * 10.));

    vec3 box1 = vec3(box(stBox1, vec2(0.6, 0.6)));
    box1 *= vec3(stripesBox1);

    vec2 stMask1 = st - vec2(0.5);
    stMask1 = rotate2d( PI/rotationBox2(u_time)) * stMask1;
    stMask1 += vec2(0.5);
	vec3 mask1 = vec3(box(stMask1, vec2(mask1Size(u_time))));

    colour += box1*mask1;


    vec2 stBox2 = st - vec2(0.5);
    stBox2 = rotate2d( PI/rotationBox2(u_time)) * stBox2;
    stBox2 += vec2(0.5);
    float stripesBox2 = step(stripesWidth(u_time), fract((stBox2.x) * 10.));

    vec3 box2 = vec3(box(stBox2, vec2(float(widthBox2(u_time)), heightBox2(u_time))));
    box2 *= vec3(stripesBox2);

    vec2 stMask2 = st - vec2(0.5);
    stMask2 = rotate2d( PI/rotationBox2(u_time)) * stMask2;
    stMask2 += vec2(0.5);
	vec3 mask2 = vec3(box(stMask2, vec2(float(0.6), 0.6)));

    colour += box2*mask2;

    vec2 stBox3 = st - vec2(0.5);
    stBox3 = rotate2d( PI/4.) * stBox3;
    stBox3 = scale( vec2(box3n4Scale(u_time)) ) * stBox3;
    stBox3 += vec2(0.5);
    vec3 box3 = vec3(box(stBox3, vec2(0.5)));
    vec2 stBox4 = st - vec2(0.5);
    stBox4 = scale( vec2(box3n4Scale(u_time)) ) * stBox4;
    stBox4 += vec2(0.5);
    vec3 box4 = vec3(box(stBox4, vec2(0.5)));
    vec3 box3n4 = box3 + box4;
    colour = mix(colour, vec3(0.), box3n4);

    outColor = vec4(colour, 1.0);
}
`;
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


#define BLOOM_BLEND_AMOUNT 64.
#define BLOOM_INTENSITY 6.

#define GRAIN_INTENSITY 0.15

#define DUST_AMOUNT 0.15

#define SHAKE_INTENSITY 0.002

#define ABBERATION_INTENSITY 0.001

#define LINES_AMOUNT 150.
#define LINES_INTENSITY 0.1


// --- NOISE AND RANDOM FUNCTIONS ---

float random (float x) {
    return fract(sin(x)*10000.0);
}
float noise(float st) {
    return mix(random(floor(st)), random(floor(st) + 1.0), smoothstep(0.,1.,fract(st)));
}
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


// --- BLOOM HELPER FUNCTIONS 

float luma(vec4 col)
{
    return (col.r + col.g + col.b) / 3.;
}

vec4 textureB(sampler2D sampler, vec2 uv)
{
    vec4 col = texture(sampler,uv);
    col *= step(0.4, luma(col));
    return col;
}


// --- BLOOM FUNCTION

vec4 bloom(vec2 uv)
{
    float blurDist = 0.1;
    float halfBlurIters = BLOOM_BLEND_AMOUNT;

    float blurStep = blurDist/halfBlurIters;

    vec4 col1 = vec4(0.);
    vec4 col2 = vec4(0.);

    vec2 uX = vec2(1, 0);
    vec2 uY = vec2(0,1);

    for(float i = 0.; i < halfBlurIters; i++)
    {
        float offset = blurStep * (i - halfBlurIters/2.);
        //col1 += textureB(u_texture, uv + (uX * offset) - (uY * offset/3.));  // DIAGONAL BLUR INSTAD OF HORIZONTAL
        col1 += textureB(u_texture, uv + (uX * offset));
    }

    col1 /=  halfBlurIters/BLOOM_INTENSITY;

    for(float i = 0.; i < halfBlurIters; i++)
    {
        float offset = blurStep * (i - halfBlurIters/2.);
        //col2 += textureB(u_texture, uv - (uX * offset/3.) + (uY * offset));  // DIAGONAL BLUR INSTAD OF VERICAL
        col2 += textureB(u_texture, uv + (uY * offset));
    }

    col2 /= halfBlurIters/BLOOM_INTENSITY;

    return (col1 + col2)/12.;
}


// --- GRAIN FUNCTION

float grain (vec2 st) {
    float noise = fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123+(u_time*2.));
    return noise * GRAIN_INTENSITY;
}


// --- DUST FUNCTION

vec4 dust (vec2 uv, vec4 color) {
    float noiseValue1 = snoise(uv * 40.0 + vec2((noise(floor((u_time*3.7)))), uv * 40.0 + vec2(noise(floor((-u_time*2.)-10.)))));
    float noiseValue2 = snoise(uv * 42.0 + vec2(noise(floor((-u_time*2.6)+80.)), uv * 42.0 + vec2(noise(floor((u_time*5.)+50.)))));
    float noiseValue = step(noiseValue1 * noiseValue2, 1.-DUST_AMOUNT);
    float dustEffect = 1. - noiseValue;
    vec3 dustColor = vec3(1., 0.2, 0.3);
    color = mix(color, vec4(dustColor, 0.5), dustEffect);
    return color;
}


// --- SHAKE FUNCTION

vec2 shake (vec2 uv) {
    uv *= 0.98;
    uv += 0.01;
    uv *= 1. + noise(floor(u_time*0.5))*SHAKE_INTENSITY;
    uv.x += noise(floor(u_time*3.))*SHAKE_INTENSITY;
    uv.y += noise(floor((u_time+1.)*3.))*SHAKE_INTENSITY;
    return uv;
}


// --- ABBERATION FUNCTION

vec4 abberation (vec2 uv, vec4 color) {
    float aberration = random(floor(u_time)+abs(atan(u_time)*0.001)) * ABBERATION_INTENSITY;
    color.r = texture(u_texture, uv + vec2(aberration, -aberration)).r;
    color.b = texture(u_texture, uv - vec2(aberration, -aberration)).b;
    return color;
}


// --- PIXELATION FUNCTION

vec2 pixelate (vec2 uv) {
    float pixels = 800.;
    float dx = (u_resolution.x/pixels) * (1.0 / pixels);
    float dy = (u_resolution.y/pixels) * (1.0 / pixels);
    uv = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
    return uv;
}


// --- LINES FUNCTION

float lines (vec2 uv) {
    float scaledUv = (v_texCoord.y) * LINES_AMOUNT;
    scaledUv += sin(floor(u_time*2.2)/5.);
    float lines = (step(0.6, fract(scaledUv)));
    lines = 1. - lines * LINES_INTENSITY;
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
`;

// for shaders
const canvasA = document.getElementById('c_artwork');

canvasA.width = 600; canvasA.height = 600;
const gl = canvasA.getContext('webgl2');

// for video parameters
const video = document.getElementById('video');
const canvasV = document.getElementById('c_video');
const ctx = canvasV.getContext('2d');
const resultDiv = document.getElementById('result');

let prevFrame = [];
let motion = 0.5;

const processFrame = () => {
    if (video.paused || video.ended) return;
    ctx.drawImage(video, 0, 0, canvasV.width, canvasV.height);
    const maxPossibleDifference = 255;
    const maxPixels = canvasV.width * canvasV.height;
    const adjustedMaxPixels = maxPixels / 1.8;
    const maxTotalMotion = maxPossibleDifference * adjustedMaxPixels;
    motion = getMotion(maxTotalMotion);
    return motion;
}

const initVideo = () => {
    // get webcam stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
        });

    // wait for the video metadata to load
    video.addEventListener('loadedmetadata', () => {
        canvasV.width = video.videoWidth;
        canvasV.height = video.videoHeight;
    });
}

const initShaders = () => {
    // setting up first program for artwork
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
    const u_motionLocation1 = gl.getUniformLocation(program1, "u_motion");

    const program1Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program1Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, program1data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(0);

    gl.bindVertexArray(null);


    // creating a texture for the artwork
    const fragColourTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvasA.width, canvasA.height);

    gl.bindTexture(gl.TEXTURE_2D, null);


    // creating a framebuffer to render the first program into the texture
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fragColourTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // setting up second program for post-processing
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

        // get colours from video every second
        if (Math.floor(time) % 2000 < 15) {
            motion = processFrame();
            console.log(motion);
            if (motion === undefined) {
                motion = 0.5;
            }
        }
        // render the first program into the texture in the framebuffer
        gl.useProgram(program1);
        // assign uniforms
        gl.uniform1f(u_timeLocation1, time / 1000);
        gl.uniform2f(u_resolutionLocation1, canvasA.width, canvasA.height);
        gl.uniform1f(u_motionLocation1, motion);
        gl.bindVertexArray(program1VAO);
        // bind buffer to draw into it
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // unbind buffer to make sure it can be read from next
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // render the second program with the texture
        gl.useProgram(program2);
        gl.uniform1f(u_timeLocation2, time / 1000);
        gl.uniform2f(u_resolutionLocation2, canvasA.width, canvasA.height);
        gl.bindVertexArray(program2VAO);
        gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindVertexArray(null);

        requestAnimationFrame(animate);
    }

    animate();
}



const getMotion = (maxTotalMotion) => {

    const differenceThreshold = 50;
    let totalMotion = 0;

    const imageData = ctx.getImageData(0, 0, canvasV.width, canvasV.height).data;

    // calculate the average luminance of the image + normalise
    for (let i = 0; i < imageData.length; i += 4) {
        const red = imageData[i];
        // if there is enough difference between the current and previous frame in the red channel, add it to the total
        if (prevFrame[i] && Math.abs(prevFrame[i] - red) > differenceThreshold) {
            totalMotion += Math.abs(prevFrame[i] - red);
        }
    }
    const normalisedMotion = Math.min(totalMotion / maxTotalMotion, 1);

    // save the current frame for the next iteration
    prevFrame = imageData;

    return normalisedMotion;
}


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

const init = () => {
    canvasV.style.display = 'none';
    video.style.display = 'none';
    canvasA.style.width = '100vw';
    canvasA.style.height = '100vh';
    canvasA.style.objectFit = 'contain';

    initVideo();
    initShaders();
}

init();





