import vertexShaderRaw from './shaders/vertex.glsl?raw';
import fragmentShaderRaw1 from './shaders/fragment1.glsl?raw';
import fragmentShaderRaw2 from './shaders/fragment2.glsl?raw';
import fragmentShaderRaw3 from './shaders/fragment3.glsl?raw';

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

const init = (canvas, fragmenShaderRaw) => {
    const gl = canvas.getContext('webgl2');

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderRaw);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmenShaderRaw);

    const program = createProgram(gl, vertexShader, fragmentShader);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    const u_resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const u_timeLocation = gl.getUniformLocation(program, "u_time");

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

    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    gl.uniform3f(u_resolutionLocation, canvas.width, canvas.height, 0);

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

    drawScene();
};

const canvases1 = document.querySelectorAll('.artwork1');
canvases1.forEach(canvas => {
    init(canvas, fragmentShaderRaw1);
});
const canvases2 = document.querySelectorAll('.artwork2');
canvases2.forEach(canvas => {
    init(canvas, fragmentShaderRaw2);
});
const canvases3 = document.querySelectorAll('.artwork3');
canvases3.forEach(canvas => {
    init(canvas, fragmentShaderRaw3);
});