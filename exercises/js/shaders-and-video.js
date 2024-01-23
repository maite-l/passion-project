// shader code
const vertexShader1Source = `#version 300 es

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

uniform vec3 colorA;
uniform vec3 colorB;
uniform vec3 colorC;

// vec3 colorA = vec3(0.089,0.110,0.109);
// vec3 colorB = vec3(0.965,0.912,0.095);
// vec3 colorC = vec3(0.940,0.008,0.053);

void main() {

    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    st.x += sin(u_time)/10.;

    float pct1 = step(1./3., st.x);
	float pct2 = step(2./3., st.x);


    vec3 color = mix(colorA, colorB, pct1);
    color *= mix(colorB, colorC, pct2);


    outColor = vec4(color, 1.0);
}
`;
const vertexShader2Source = `#version 300 es

precision highp float;

in vec2 a_position;

out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0., 1.);
    v_texCoord = a_position.xy * 0.5 + 0.5;
}
`;
const fragmentShader2Source = `#version 300 es

precision highp float;

uniform sampler2D u_texture;
in vec2 v_texCoord;

out vec4 outColor;

vec3 adjustBrightness(vec3 color, float value) {
    return color + value;
}

void main() {
    vec4 sampleColor = texture(u_texture, v_texCoord);
    sampleColor.rgb = adjustBrightness(sampleColor.rgb, 0.5);
    outColor = sampleColor;
}
`;

// for shaders
const canvasA = document.getElementById('c_artwork');
canvasA.width = 600; canvasA.height = 600;
const gl = canvasA.getContext('webgl2');

// for video parameters
const video = document.getElementById('video');
const canvasV = document.getElementById('c_video');
const ctx = canvasV.getContext('2d');
const resultDiv = document.getElementById('result');

let colourPalette = [[0,0,0],[0,0,0],[0,0,0]];
let lastParameterUpdate = 0; 

const processFrame = () => {
    if (video.paused || video.ended) return;
    ctx.drawImage(video, 0, 0, canvasV.width, canvasV.height);
    let colourPalette = getColours();
    return colourPalette;
}

const initVideo = () => {
    // get webcam stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
        });

    // wait for the video metadata to load
    video.addEventListener('loadedmetadata', () => {
        canvasV.width = video.videoWidth;
        canvasV.height = video.videoHeight;
    });
}

const initShaders = () => {
    // setting up first program for artwork
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
    const u_colourALocation1 = gl.getUniformLocation(program1, "colorA");
    const u_colourBLocation1 = gl.getUniformLocation(program1, "colorB");
    const u_colourCLocation1 = gl.getUniformLocation(program1, "colorC");

    const program1Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program1Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, program1data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(0);

    gl.bindVertexArray(null);


    // creating a texture for the artwork
    const fragColourTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvasA.width, canvasA.height);

    gl.bindTexture(gl.TEXTURE_2D, null);


    // creating a framebuffer to render the first program into the texture
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fragColourTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // setting up second program for post-processing
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

    const program2Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program2Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, program2data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(0);

    gl.bindVertexArray(null);

    const animate = (time = 0) => {

        // get colours from video every second
        const now = new Date().getTime();
        if (now - lastParameterUpdate >= 1000) {
            colourPalette = processFrame();
            if (colourPalette === undefined) {
                colourPalette = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
            }
            lastParameterUpdate = now;
        }

        // render the first program into the texture in the framebuffer
        gl.useProgram(program1);
        // assign uniforms
        gl.uniform1f(u_timeLocation1, time / 1000);
        gl.uniform2f(u_resolutionLocation1, canvasA.width, canvasA.height);
        gl.uniform3f(u_colourALocation1, colourPalette[0][0], colourPalette[0][1], colourPalette[0][2]);
        gl.uniform3f(u_colourBLocation1, colourPalette[1][0], colourPalette[1][1], colourPalette[1][2]);
        gl.uniform3f(u_colourCLocation1, colourPalette[2][0], colourPalette[2][1], colourPalette[2][2]);
        gl.bindVertexArray(program1VAO);
        // bind buffer to draw into it
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // unbind buffer to make sure it can be read from next
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // render the second program with the texture
        gl.useProgram(program2);
        gl.bindVertexArray(program2VAO);
        gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindVertexArray(null);

        requestAnimationFrame(animate);
    }

    animate();
}

const colourDifference = (colour1, colour2) => {
    // Euclidean distance between two RGB colours https://en.wikipedia.org/wiki/Color_difference
    const rDiff = colour1[0] - colour2[0];
    const gDiff = colour1[1] - colour2[1];
    const bDiff = colour1[2] - colour2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

const parseRGB = (rgbString) => {
    return rgbString.match(/\d+/g).map(Number);
}

const getColours = () => {

    const colourAmount = 3;
    const differenceThreshold = 80;

    // get pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvasV.width, canvasV.height).data;


    // make object with colour and how many times it appears
    const colourCounts = {};
    for (let i = 0; i < imageData.length; i += 4) {
        const colour = [imageData[i], imageData[i + 1], imageData[i + 2]];
        const colourString = `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
        if (colourString in colourCounts) {
            colourCounts[colourString] = colourCounts[colourString] + 1;
        } else {
            colourCounts[colourString] = 1;
        }
    }

    // sort colours by how many times they appear
    const sortedColours = Object.keys(colourCounts).sort((a, b) => colourCounts[b] - colourCounts[a]);

    // get the most common colours that are different enough
    let newColourPalette = [sortedColours[0]];
    for (let i = 1; i < sortedColours.length; i++) {
        const currentColour = sortedColours[i];

        const include = newColourPalette.every(paletteColour => {
            const difference = colourDifference(
                parseRGB(currentColour),
                parseRGB(paletteColour)
            );
            return difference >= differenceThreshold;
        });

        if (include && newColourPalette.length < colourAmount) {
            newColourPalette.push(currentColour);
        }
    }
    return newColourPalette.map(colour => parseRGB(colour).map(c => c / 255));
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

const init = () => {
    canvasV.style.display = 'none';
    video.style.display = 'none';
    initVideo();
    initShaders();
}

init();





