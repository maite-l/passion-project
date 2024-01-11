
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

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.905,1.000,0.694);
    float shape = 0.0;

    vec3 coloredTile;

    st += vec2(0.04,0.15);
    st *= 3.0;

    float offset = sin(u_time) * 0.1;

    // ADDITION
	if (ceil(st) == vec2(1.0, 3.0)){
        st -= vec2(1.0, 3.0) - 1.;
    	shape += smoothstep(distance(st,vec2(0.380+offset,0.370)) + distance(st,vec2(0.630,0.610))-0.008, distance(st,vec2(0.380+offset,0.370)) + distance(st,vec2(0.630,0.610)), 0.428);
        //color *= shape;
    }

    // MULTIPLICATION
    if (ceil(st) == vec2(2.0, 3.0)){
        st -= vec2(2.0, 3.0) - 1.;
    	shape += smoothstep(distance(st,vec2(0.360+offset,0.370)) * distance(st,vec2(0.640,0.600))-0.008, distance(st,vec2(0.360+offset,0.370)) * distance(st,vec2(0.640,0.600)), 0.036);
        //color *= shape;
    }

    // MINIMUM
    if (ceil(st) == vec2(3.0, 3.0)){
        st -= vec2(3.0, 3.0) - 1.;
    	shape += smoothstep(min(distance(st,vec2(0.440+offset,0.400)),distance(st,vec2(0.560,0.550)))-0.008,min(distance(st,vec2(0.440+offset,0.400)),distance(st,vec2(0.560,0.550))), 0.132);
        //color *= shape;
    }

    // MAXIMUM
    if (ceil(st) == vec2(1.0, 2.0)){
        st -= vec2(1.0, 2.0) - 1.;
    	shape += smoothstep(max(distance(st,vec2(0.660+offset,0.500)),distance(st,vec2(0.510,0.500)))-0.008,max(distance(st,vec2(0.660+offset,0.500)),distance(st,vec2(0.510,0.500))), 0.260);
        //color *= shape;
    }

    // POWER
    if (ceil(st) == vec2(2.0, 2.0)){
        st -= vec2(2.0, 2.0) - 1.;
    	shape += smoothstep(pow(distance(st,vec2(0.660+offset,0.500)),distance(st,vec2(0.510,0.500)))-0.008,pow(distance(st,vec2(0.660+offset,0.500)),distance(st,vec2(0.510,0.500))), 0.460);
        //color *= shape;
    }

    // NOTHING
    if (ceil(st) == vec2(3.0, 2.0)){
        st -= vec2(3.0, 2.0) - 1.;
    	float shape1 = 1.-smoothstep(distance(st,vec2(0.380+offset,0.370))-0.008,distance(st,vec2(0.380+offset,0.370)), 0.156);
        float shape2 = 1.-smoothstep(distance(st,vec2(0.680,0.640))-0.008, distance(st,vec2(0.680,0.640)), 0.108);
        shape += 1.-(shape1 * shape2);
        //color *= shape;
    }

    st = fract(st);

    color = mix(color, vec3(0.0, 0.3, 0.6), shape);

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
