
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

vec2 tile(vec2 st, float zoom){
    st *= zoom;
    return fract(st);
}


float circle(in vec2 _st, in float _radius){
    vec2 l = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.05),
                         _radius+(_radius*0.05),
                         dot(l,l)*4.0);
}

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);

    st += 0.1;

	vec2 grid1 = rotate2D(tile(st, 6.),(-PI+u_time)/4.);
    color = mix(color, vec3(1.), box(grid1, vec2(0.9), 0.02));
    color = mix(color, vec3(0.086,0.457,0.665), circle(grid1, 0.2*abs(sin(u_time))+0.1));

    vec2 grid2 = rotate2D(tile(st + 0.25, 6.),(PI+u_time)/4.);
    color = mix(color, vec3(0.), box(grid2, vec2(0.4), 0.02));

    vec2 grid3 = rotate2D(tile(st + 0.25, 6.),PI/4.);
    color = mix(color, vec3(1.), box(grid2, vec2(0.18), 0.02));

	gl_FragColor = vec4( color, 1.0 );
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
