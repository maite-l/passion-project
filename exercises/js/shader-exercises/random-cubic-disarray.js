const vertexShaderRaw = `#version 300 es

precision highp float;

in vec2 a_position;

void main() {
    gl_Position = vec4(a_position, 1, 1);
}
`;
const fragmentShaderRaw = `#version 300 es

precision highp float;

uniform vec3 u_resolution;
uniform float u_time;
uniform float u_seed;

out vec4 outColor;


float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size, _size+vec2(0.02), _st);
    uv *= smoothstep(_size, _size+vec2(0.02), vec2(1.0)-_st);
    return uv.x*uv.y;
}

vec2 rotate2D (vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float random (float x) {
    return fract(sin(x)*10000.0);
}

#define PI 3.14159265359

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;
    vec3 color = vec3(0.0);

    float zoom = 9.0;
    vec2 size = vec2(0.7);

    st.y = 1. - st.y;
    st *= zoom;

    vec2 ipos = floor(st);
    vec2 fpos = fract(st);
    ipos.x += 1.;

    st = fpos;

    float cellIndex = ipos.x+(ipos.y*zoom);
    st = rotate2D(st, 0.005*cellIndex*random(cellIndex+u_seed));

    color = vec3(box(st,size))*vec3(1.);
    color = mix(color,vec3(cellIndex/100.), vec3(box(st,(size)-0.1)) );

    outColor = vec4(color, 1.0);
}
`;

const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined;
};

const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
};

const canvas = document.querySelector('#c');
const gl = canvas.getContext('webgl2');

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderRaw);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderRaw);

const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const positionBuffer = gl.createBuffer();

const vao = gl.createVertexArray();

const u_resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const u_timeLocation = gl.getUniformLocation(program, "u_time");
const u_seed = gl.getUniformLocation(program, "u_seed");

const init = async () => {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, 1.0, 
            1.0, 1.0,
            -1.0, -1.0,

            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0
        ]),
        gl.STATIC_DRAW);

    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    canvas.width = 600; canvas.height = 600;
    gl.uniform3f(u_resolutionLocation, canvas.width, canvas.height, 0);
    let seed = new Date();
    seed = seed.getMonth() + seed.getDate() + seed.getHours() + seed.getMinutes() + seed.getSeconds();
    //const seed = Math.random();
    console.log(seed);
    gl.uniform1f(u_seed, seed);

    drawScene();
};

const drawScene = (time = 0) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1f(u_timeLocation, time / 1000);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(drawScene);
};

init();
