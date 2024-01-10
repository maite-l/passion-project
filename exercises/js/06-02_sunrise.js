
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

uniform vec3 u_resolution;
uniform float u_time;

#define PI 3.14159265359

varying vec2 uv;

vec3 colorA = vec3(0.738,0.912,0.903);
vec3 colorB = vec3(0.);
vec3 colorC = vec3(0.304,0.079,0.405);

float cubicPulse( float c, float w, float x ){
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);

    vec3 pct1 = vec3(st.y);
    vec3 pct2 = vec3(smoothstep(0.0,2., st.y));
    pct2.b = 1.-st.y;
    vec3 pctFinal = sin(vec3(u_time/2.))*2.;

    vec3 mixA = mix(colorA, colorC, pct1);
    vec3 mixB = mix(colorC, colorB, pct2);
    color = mix(mixA, mixB, pctFinal);

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
