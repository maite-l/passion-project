

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

// https://www.shadertoy.com/view/fsSXWV
const fragmentShader2Source = `#version 300 es

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

uniform sampler2D u_texture;
in vec2 v_texCoord;

out vec4 outColor;

#define BLEND_AMOUNT 64.
#define INTENSITY 8.


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

vec4 bloom(vec2 uv)
{
    float blurDist = 0.2;
    float halfBlurIters = BLEND_AMOUNT;

    float blurStep = blurDist/halfBlurIters;

    vec4 col1 = vec4(0.);
    vec4 col2 = vec4(0.);

    vec2 uX = vec2(1, 0);
    vec2 uY = vec2(0,1);

    for(float i = 0.; i < halfBlurIters; i++)
    {
        float offset = blurStep * (i - halfBlurIters/2.);
        col1 += textureB(u_texture, uv + (uX * offset) - (uY * offset/3.));  // DIAGONAL BLUR INSTAD OF HORIZONTAL
        //col1 += textureB(u_texture, uv + (uX * offset));
    }

    col1 /=  halfBlurIters/INTENSITY;

    for(float i = 0.; i < halfBlurIters; i++)
    {
        float offset = blurStep * (i - halfBlurIters/2.);
        col2 += textureB(u_texture, uv - (uX * offset/3.) + (uY * offset));  // DIAGONAL BLUR INSTAD OF VERICAL
        //col2 += textureB(u_texture, uv + (uY * offset));
    }

    col2 /= halfBlurIters/INTENSITY;

    return (col1 + col2)/12.;
}

void main() {

    vec4 col = texture(u_texture,v_texCoord);
    col += bloom(v_texCoord);

    outColor = col;
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

