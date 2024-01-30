import vArtworkSource from './shaders/vert_artwork.glsl?raw';
import fArtwork1Source from './shaders/frag_artwork-1.glsl?raw';
import fArtwork2Source from './shaders/frag_artwork-2.glsl?raw';
import fArtwork3Source from './shaders/frag_artwork-3.glsl?raw';
import fPPRawSource from './shaders/frag_post-processing.glsl?raw';
import vPPSource from './shaders/vert_post-processing.glsl?raw';

import { getColours, getMotion, getContrast } from './get-parameter.js';

// for video parameters
const video = document.querySelector('.video');
const canvasV = document.querySelector('.video_canvas');

let interactive = false;
const defaultContrast = 0.5; const defaultMotion = 0.2; const defaultColourPalette = [[0.562, 0.516, 0.912], [0.544, 0.805, 0.298], [0.141, 0.368, 0.775]];
let contrast = defaultContrast; let motion = defaultMotion; let colourPalette = defaultColourPalette;
let seed;

const initVideo = () => {
    console.log('init video');
    // get webcam stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            console.log('video stream');
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
            const videoError = document.querySelector('.video__error');
            videoError.style.display = 'flex';
            document.querySelector('.loading').style.display = 'none';
        });

    // wait for the video metadata to load
    video.addEventListener('loadedmetadata', () => {
        canvasV.width = video.videoWidth;
        canvasV.height = video.videoHeight;
    });
}

const initArtwork = (canvas, fragmentShaderRaw, parameter) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const gl = canvas.getContext('webgl2');
    const ctx = canvasV.getContext('2d');
    initShaders(canvas, fragmentShaderRaw, gl, ctx, parameter);
};

const processFrame = (ctx, parameterType) => {
    if (video.paused || video.ended) return;
    ctx.drawImage(video, 0, 0, canvasV.width, canvasV.height);

    if (parameterType === 'contrast') {
        return getContrast(ctx, canvasV);
    }
    else if (parameterType === 'motion') {
        const maxPossibleDifference = 255;
        const maxPixels = canvasV.width * canvasV.height;
        const adjustedMaxPixels = maxPixels / 5;
        const maxTotalMotion = maxPossibleDifference * adjustedMaxPixels;
        return getMotion(ctx, maxTotalMotion, canvasV);
    }
    else if (parameterType === 'colour') {
        return getColours(ctx, canvasV);
    }
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

const initShaders = (canvas, fs, gl, ctx, parameter) => {
    // setting up first program for artwork
    const program1 = createProgram(gl, vArtworkSource, fs);

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
    const u_contrastLocation1 = gl.getUniformLocation(program1, "u_contrast");
    const u_motionLocation1 = gl.getUniformLocation(program1, "u_motion");
    const u_colourALocation1 = gl.getUniformLocation(program1, "colourA");
    const u_colourBLocation1 = gl.getUniformLocation(program1, "colourB");
    const u_colourCLocation1 = gl.getUniformLocation(program1, "colourC");
    const u_seed = gl.getUniformLocation(program1, "u_seed");

    const program1Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program1Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, program1data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(0);

    gl.bindVertexArray(null);


    // creating a texture for the artwork
    const fragColourTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);

    gl.bindTexture(gl.TEXTURE_2D, null);


    // creating a framebuffer to render the first program into the texture
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fragColourTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // setting up second program for post-processing
    const program2 = createProgram(gl, vPPSource, fPPRawSource);

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

        if (interactive) {
            if (parameter === 'contrast') {
                if (Math.floor(time) % 2000 < 15) {
                    contrast = processFrame(ctx, parameter);
                    console.log('contrast: ' + contrast);
                    if (contrast === undefined) {
                        contrast = defaultContrast;
                    } else {
                        document.querySelector('.loading').style.display = 'none';
                    }
                }
            }
            else if (parameter === 'motion') {
                if (Math.floor(time) % 1000 < 15) {
                    motion = processFrame(ctx, parameter);
                    console.log('motion: ' + motion);
                    if (motion === undefined) {
                        motion = defaultMotion;
                    } else {
                        document.querySelector('.loading').style.display = 'none';
                    }

                }
            }
            else if (parameter === 'colour') {
                if (Math.floor(time) % 2000 < 15) {
                    colourPalette = processFrame(ctx, parameter);

                    if (colourPalette === undefined) {
                        colourPalette = defaultColourPalette;
                    } else {
                        document.querySelector('.loading').style.display = 'none';
                    }
                    for (let i = 0; i < 3; i++) {
                        if (colourPalette[i] === undefined) {
                            colourPalette[i] = defaultColourPalette[i];
                        }
                    }
                    console.log(colourPalette);
                }
            }
        }

        // render the first program into the texture in the framebuffer
        gl.useProgram(program1);
        // assign uniforms
        gl.uniform1f(u_timeLocation1, time / 1000);
        gl.uniform2f(u_resolutionLocation1, canvas.width, canvas.height);
        gl.uniform3f(u_colourALocation1, colourPalette[0][0], colourPalette[0][1], colourPalette[0][2]);
        gl.uniform3f(u_colourBLocation1, colourPalette[1][0], colourPalette[1][1], colourPalette[1][2]);
        gl.uniform3f(u_colourCLocation1, colourPalette[2][0], colourPalette[2][1], colourPalette[2][2]);
        gl.uniform1f(u_contrastLocation1, contrast);
        gl.uniform1f(u_motionLocation1, motion);
        gl.uniform1f(u_seed, seed);
        gl.bindVertexArray(program1VAO);
        // bind buffer to draw into it
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // unbind buffer to make sure it can be read from next
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // render the second program with the texture
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
}


const init = () => {
    interactive = document.body.classList.contains('interactive');
    if (interactive) {
        initVideo();
    }

    seed = Math.random();

    let canvases1, canvases2, canvases3;

    console.log(window.innerWidth);

    if (window.innerWidth <= 768) {
        canvases1 = document.querySelectorAll('.artwork1__mobile');
        canvases2 = document.querySelectorAll('.artwork2__mobile');
        canvases3 = document.querySelectorAll('.artwork3__mobile');
    } else {
        canvases1 = document.querySelectorAll('.artwork1');
        canvases2 = document.querySelectorAll('.artwork2');
        canvases3 = document.querySelectorAll('.artwork3');
    }
    canvases1.forEach(canvas => initArtwork(canvas, fArtwork1Source, 'contrast'));
    canvases2.forEach(canvas => initArtwork(canvas, fArtwork2Source, 'motion'));
    canvases3.forEach(canvas => initArtwork(canvas, fArtwork3Source, 'colour'));
}

init();





