
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


float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size, _size+vec2(0.001), _st);
    uv *= smoothstep(_size, _size+vec2(0.001), vec2(1.0)-_st);
    return uv.x*uv.y;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.);

    vec3 border1 = 1. - vec3(box(st, vec2(0.9)));
    vec3 border2 = 1. - vec3(box(st, vec2(0.9)));
    border2 -= 1. - vec3(box(st, vec2(0.915)));

    st *= 4.;
    st += vec2(u_time/5.,u_time/2.);
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);

    for (int i = 0; i < 2; i++) {
        if (random(ipos) < 0.3) 
        {
        	st *= 2.0;
     		ipos = floor(st);
     		fpos = fract(st);
            float size = 1. - float(i+1)/20.;
        	color = vec3(box(fpos, vec2(size)))*vec3(0.798,0.971,1.000);

            for (int j = 1; j < 2; j++) {
                if (random(ipos) < 0.3) {
                    st *= 2.0;
             		ipos = floor(st);
             		fpos = fract(st);
                	size = 1. - float(j+1)/10.;
                    color = vec3(box(fpos, vec2(size)))*vec3(0.798,0.971,1.000);
            	} 
                else if (random(ipos) < 0.9) {
                    color = vec3(box(fpos, vec2(size)))*vec3(0.798,0.971,1.000);
                } 
                else {
                    color = vec3(0.);
                }
            }

        } else if (random(ipos) < 0.9) {
            float size = 1. - 0.5*float(i+1)/20.;
            color = vec3(box(fpos, vec2(0.98)))*vec3(0.798,0.971,1.000);
        } else {
            color = vec3(0.);
        }
    }




    color = mix(color, vec3(0.798,0.971,1.000), border1);
    color = mix(color, vec3(0.0), border2);

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
