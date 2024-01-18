
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

#define TWO_PI 6.28318530718

uniform vec3 u_resolution;
uniform float u_time;

float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size,
                        _size+vec2(0.001),
                        _st);
    uv *= smoothstep(_size,
                    _size+vec2(0.001),
                    vec2(1.0)-_st);
    return uv.x*uv.y;
}

vec3 boxOutline(in vec2 _st, in vec2 _size){
    vec3 result = vec3(0.0);
    result += box(_st, _size);
    result -= box(_st, _size - vec2(0.04));
    return result;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(1.000,0.994,0.950);

    vec3 redBoxes = vec3(0.0);
 	vec3 yellowBoxes = vec3(0.0);
    vec3 blueBoxes = vec3(0.0);
    vec3 outline = vec3(0.0);

    st += vec2(0.5);

    redBoxes += box(st-vec2(0.090,0.830), vec2(0.180,0.350));

    outline += boxOutline(st-vec2(0.040,0.830), vec2(0.120,0.380));
    outline += boxOutline(st-vec2(0.090,0.920), vec2(0.220,0.20));

    outline += boxOutline(st-vec2(0.09,0.26), vec2(0.22,0.8));

    outline += boxOutline(st-vec2(0.09,0.26), vec2(0.22,0.8));

    outline += boxOutline(st-vec2(0.38,0.04), vec2(0.4,0.12));
    outline += boxOutline(st-vec2(0.380,0.370), vec2(0.4,0.58));
    outline += boxOutline(st-vec2(0.380,0.740), vec2(0.4,0.2));
    outline += boxOutline(st-vec2(0.380,0.920), vec2(0.4,0.2));

    blueBoxes += box(st-vec2(0.790,0.04), vec2(0.460,0.12));

    outline += boxOutline(st-vec2(0.710,0.04), vec2(0.30,0.12));
    outline += boxOutline(st-vec2(0.93,0.040), vec2(0.18,0.12));

    outline += boxOutline(st-vec2(0.710,0.37), vec2(0.30,0.58));
    outline += boxOutline(st-vec2(0.93,0.37), vec2(0.18,0.58));

    outline += boxOutline(st-vec2(0.710,0.92-0.2+0.02), vec2(0.30,0.2));
    outline += boxOutline(st-vec2(0.93,0.92-0.2+0.02), vec2(0.18,0.2));

    outline += boxOutline(st-vec2(0.710,0.92), vec2(0.30,0.2));

    yellowBoxes += box(st-vec2(0.920,0.830), vec2(0.160,0.350));


    vec3 red = vec3(0.860,0.007,0.056);
    vec3 blue = vec3(0.199,0.434,0.860);
    vec3 yellow = vec3(0.860,0.781,0.053);
    vec3 outlineColor = vec3(0.022,0.018,0.030);
    color = mix(color, red, redBoxes);
    color = mix(color, blue, blueBoxes);
    color = mix(color, yellow, yellowBoxes);
    color = mix(color, outlineColor, outline);

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
