
const vertexShaderRaw = `
precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 uv;

void main() {
    gl_Position = vec4(a_position, 1, 1);
    uv = a_texCoord;
}
`;
const fragmentShaderRaw = `
precision mediump float;

#define PI 3.14159265359

uniform vec3 u_resolution;
uniform float u_time;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float random (in float x) {
    return fract(sin(x)*1e4);
}

vec3 movingCells(vec2 _st, vec2 _zoom, float _freq){
    _st *= _zoom*vec2(_freq, 1.);

    // move rows in opposite directions
    float row = 2.0 * step(1.0, mod(_st.y, 2.0)) - 1.0;
    _st.x += (row*_freq * (0.5+u_time*4.*_freq) + row*100.);

    vec2 integer = floor(_st);
    vec2 fractional = fract(_st);

    // divide cell vertically into coloured and white part based on random value of that cell
    vec3 color = vec3(step(fractional.x, random(integer )));

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
	vec3 color = vec3(1.000,0.984,0.748);

    float freq = random(floor(u_time))+abs(atan(u_time)*0.1);
    color = movingCells(st, vec2(10., 2.), freq);

    gl_FragColor = vec4(color,1.0);
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
};

const canvas = document.querySelector('#c');
const gl = canvas.getContext('webgl');

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderRaw);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderRaw);

const program = createProgram(gl, vertexShader, fragmentShader);
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const positionBuffer = gl.createBuffer();
const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");
const texCoordBuffer = gl.createBuffer();

const u_resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const u_timeLocation = gl.getUniformLocation(program, "u_time");

const init = async () => {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, 1.0,  // uses clip space coordinates
            1.0, 1.0,
            -1.0, -1.0,

            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0
        ]),
        gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([  //different than the position buffer, because uses texture/image coordinates
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,

            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0,
        ]),
        gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    canvas.width = 600;
    canvas.height = 600;

    gl.uniform3f(u_resolutionLocation, canvas.width, canvas.height, 0);

    drawScene();
};

const drawScene = (time = 0) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.uniform1f(u_timeLocation, time / 1000);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(drawScene);
};

init();
