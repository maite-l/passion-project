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

uniform vec3 colourA;
uniform vec3 colourB;
uniform vec3 colourC;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

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

vec3 gradient(vec3 colourA, vec3 colourB, vec2 st, float size, vec2 offset) {
    st *= size;
    st += offset;
    return mix(colourA, colourB, snoise(st)*.5+.5);
}
float stripedPolygon( vec2 st, int sides, float size, vec2 offset, int stripesAmount, float stripeWidth ) {
    stripeWidth -= 0.5;
    st = st *2.-1.;
    st += offset;
    float a = atan(st.x,st.y)+PI;
	float r = TWO_PI/float(sides);
    float d = cos(floor(.5+a/r)*r-a)*length(st);
    float shape = 1.0-smoothstep(size+stripeWidth,size+stripeWidth+0.1,fract(d*float(stripesAmount)*2.+0.5));
    return shape *= 1.0-smoothstep(size,size+0.01,d);
}

float random (float x) {
    return fract(sin(x)*10000.0);
}
float noise(float st) {
    return mix(random(floor(st)), random(floor(st) + 1.0), smoothstep(0.,1.,fract(st)));
}


float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size, _size+vec2(0.001), _st);
    uv *= smoothstep(_size, _size+vec2(0.001), vec2(1.0)-_st);
    return uv.x*uv.y;
}
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec3 star(vec2 st, vec2 size) {
    vec3 shape = vec3(0.0);

    for (int i = 0; i < 8; ++i) {
        st -= 0.5;
        float angle = PI * float(i) / float(8.);
        st = rotate2d(angle) * st;
        st += 0.5;
        shape = mix(shape, vec3(1.), box(st, size));
    }
    return shape;
}

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st-vec2(0.5);
	return 1.-smoothstep(_radius-(_radius*0.01), _radius+(_radius*0.01), dot(dist,dist)*4.0);
}

float thickness( float u_time ) {
    return max(0.005, (sin(u_time/1.5))/10.);
}
void main() {

    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    vec3 colour = vec3(0.0);

    vec3 stripes = vec3(0.0);
    for (int i = 10; i <= 12; ++i) {
        vec2 offsetShape = (vec2(random(floor(u_time)/2. + float(i)), random(floor(u_time)/2. + float(i) + 1.)) - 0.5);
        vec2 offsetGradient = (vec2(noise((u_time) * 1.5 - 1.), noise((u_time) * 1.5 - 2.)));

        vec3 gradient = gradient(colourA, vec3(0.1,0.1,0.), st, 2., offsetGradient);
        float shape = stripedPolygon(st, 2, 0.2, offsetShape, 8, 0.8);

        stripes += (vec3(shape) * gradient) / 2.;
    }
    colour += mix(colour, stripes, 1.);



    vec2 placement1 = vec2(-0.15, -0.15) + (noise(u_time) * 2. - 1.) / 100.;
    vec2 st1 = st + placement1;
    st1 -= 0.5;
    st1 = rotate2d(cos(u_time)) * st1;
    st1 += 0.5;
    vec3 gradient1 = gradient(colourA, vec3(0.1), st, 2., vec2(noise((u_time) * 1.5), noise((u_time) * 1.5 - 1.)));
    vec3 shape1 = star(st1, vec2(1., thickness(u_time)));
    shape1 *= circle(st1, 0.2);
    colour += mix(colour, shape1 * gradient1, 1.);

    vec2 placement2 = vec2(0.15, 0.) + (noise(u_time+2.) * 2. - 1.) / 100.;;
    vec2 st2 = st + placement2;
    st2 -= 0.5;
    st2 = rotate2d(-cos(u_time+2.)) * st2;
    st2 += 0.5;
    vec3 gradient2 = gradient(colourB, vec3(0.1), st, 2., vec2(noise((u_time) * 1.5 +1.), noise((u_time) * 1.5 + 2.)));
    vec3 shape2 = star(st2, vec2(1., thickness(u_time + 3.)));
    shape2 *= circle(st2, 0.2);
    colour += mix(colour, shape2 * gradient2, 1.);

    vec2 placement3 = vec2(-0.1, 0.15) + (noise(u_time+3.) * 2. - 1.) / 100.;;
    vec2 st3 = st + placement3;
    st3 -= 0.5;
    st3 = rotate2d(-cos(u_time+3.)) * st3;
    st3 += 0.5;
    vec3 gradient3 = gradient(colourC, vec3(0.1), st, 2., vec2(noise((u_time) * 1.5 +3.), noise((u_time) * 1.5 + 4.)));
    vec3 shape3 = star(st3, vec2(1., thickness(u_time + 5.)));
    shape3 *= circle(st3, 0.2);
    colour += mix(colour, shape3 * gradient3, 1.);

    outColor += vec4(colour, 1.0);
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

let colourPalette = [[0, 0.5, 0], [0, 0, 0.5], [0.5, 0, 0]];

const processFrame = () => {
    if (video.paused || video.ended) return;
    ctx.drawImage(video, 0, 0, canvasV.width, canvasV.height);
    colourPalette = getColours();
    return colourPalette;
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
    const u_colourALocation1 = gl.getUniformLocation(program1, "colourA");
    const u_colourBLocation1 = gl.getUniformLocation(program1, "colourB");
    const u_colourCLocation1 = gl.getUniformLocation(program1, "colourC");

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
            colourPalette = processFrame();

            if (colourPalette === undefined) {
                colourPalette = [[0, 0.5, 0], [0, 0, 0.5], [0.5, 0, 0]];
            }
            for (let i = 0; i < 3; i++) {
                if (colourPalette[i] === undefined) {
                    switch (i) {
                        case 0:
                            colourPalette[i] = [(i + 1) / 3, 0, 0];
                            break;
                        case 1:
                            colourPalette[i] = [0, (i + 1) / 3, 0];
                            break;
                        case 2:
                            colourPalette[i] = [0, 0, (i + 1) / 3];
                            break;
                        default:
                            break;
                    }
                }
            }
            console.log(colourPalette);
        }
        // render the first program into the texture in the framebuffer
        gl.useProgram(program1);
        // assign uniforms
        gl.uniform1f(u_timeLocation1, time / 1000);
        gl.uniform2f(u_resolutionLocation1, canvasA.width, canvasA.height);
        gl.uniform3f(u_colourALocation1, colourPalette[0][0], colourPalette[0][1], colourPalette[0][2]);
        gl.uniform3f(u_colourBLocation1, colourPalette[1][0], colourPalette[1][1], colourPalette[1][2]);
        gl.uniform3f(u_colourCLocation1, colourPalette[2][0], colourPalette[2][1], colourPalette[2][2]);
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

const colourDifference = (colour1, colour2) => {
    // Euclidean distance between two RGB colours https://en.wikipedia.org/wiki/Color_difference
    const rDiff = colour1[0] - colour2[0];
    const gDiff = colour1[1] - colour2[1];
    const bDiff = colour1[2] - colour2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

const parseRGB = (rgbString) => {
    return rgbString.match(/\d+/g).map(Number);
}

const getColours = () => {
    const colourAmount = 3;
    const differenceThreshold = 100;

    // get pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvasV.width, canvasV.height).data;

    // make object with colour and how many times it appears
    const colourCounts = {};
    for (let i = 0; i < imageData.length; i += 4) {
        const colour = [imageData[i], imageData[i + 1], imageData[i + 2]];
        const colourString = `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
        if (colourString in colourCounts) {
            colourCounts[colourString] = colourCounts[colourString] + 1;
        } else {
            colourCounts[colourString] = 1;
        }
    }

    // sort colours by how many times they appear
    const sortedColours = Object.keys(colourCounts).sort((a, b) => colourCounts[b] - colourCounts[a]);

    // get the most common colours that are different enough and not too close to black
    let newColourPalette = [];
    for (let i = 0; i < sortedColours.length; i++) {
        let currentColour = sortedColours[i];

        let currentParsedColour = parseRGB(currentColour);
        let isWhite = false; let isBlack = false;
        if (currentParsedColour[0] > 240 || currentParsedColour[1] > 240 || currentParsedColour[2] > 240) {
            isWhite = true;
        }
        if (currentParsedColour[0] < 60 || currentParsedColour[1] < 60 || currentParsedColour[2] < 60) {
            isBlack = true;
        }


        const include = newColourPalette.every(paletteColour => {
            const difference = colourDifference(
                parseRGB(currentColour),
                parseRGB(paletteColour)
            );
            return difference >= differenceThreshold;
        });

        if (include && newColourPalette.length < colourAmount && !isWhite && !isBlack) {
            newColourPalette.push(currentColour);
        }
    }

    // add to result div
    resultDiv.innerHTML = '';
    newColourPalette.forEach(colour => {
        const colourDiv = document.createElement('div');
        colourDiv.style.backgroundColor = colour;
        colourDiv.style.width = '50px';
        colourDiv.style.height = '50px';
        resultDiv.appendChild(colourDiv);
    });

    return newColourPalette.map(colour => parseRGB(colour).map(c => c / 255));
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





