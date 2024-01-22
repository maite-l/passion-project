

const canvas = document.querySelector('#c');
canvas.width = 600; canvas.height = 600;
const gl = canvas.getContext('webgl2');

// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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


const vertexShader1Source = 
`#version 300 es

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

vec3 colorA = vec3(0.089,0.110,0.109);
vec3 colorB = vec3(0.965,0.912,0.095);
vec3 colorC = vec3(0.940,0.008,0.053);

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

const program1Buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, program1Buffer);
gl.bufferData(gl.ARRAY_BUFFER, program1data, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
gl.enableVertexAttribArray(0);

gl.bindVertexArray(null);



const fragColourTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);

gl.bindTexture(gl.TEXTURE_2D, null);


const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fragColourTexture, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);


const vertexShader2Source = `#version 300 es

precision highp float;

in vec2 a_position;

out vec2 uv;

void main() {
    gl_Position = vec4(a_position, 0., 1.);
    uv = a_position.xy * 0.5 + 0.5;
}
`;
const fragmentShader2Source = `#version 300 es

precision highp float;

uniform sampler2D sampler;
in vec2 uv;

out vec4 outColor;

vec3 adjustBrightness(vec3 color, float value) {
    return color + value;
}

void main() {
    vec4 sampleColor = texture(sampler, uv);
    sampleColor.rgb = adjustBrightness(sampleColor.rgb, 0.5);
    outColor = sampleColor;
}
`;


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

    gl.useProgram(program1);
    gl.uniform1f(u_timeLocation1, time / 1000);
    gl.uniform2f(u_resolutionLocation1, canvas.width, canvas.height);
    gl.bindVertexArray(program1VAO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(program2);
    gl.bindVertexArray(program2VAO);
    gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
    // gl.enable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);

    requestAnimationFrame(animate);
}
animate();


























// const canvas = document.querySelector('#c');
// const gl = canvas.getContext('webgl2');

// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// const createProgram = (gl, vs, fs) => {
//     const program = gl.createProgram();

//     const vertexShader = gl.createShader(gl.VERTEX_SHADER);
//     gl.shaderSource(vertexShader, vs);
//     gl.compileShader(vertexShader);
//     gl.attachShader(program, vertexShader);

//     const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
//     gl.shaderSource(fragmentShader, fs);
//     gl.compileShader(fragmentShader);
//     gl.attachShader(program, fragmentShader);

//     gl.linkProgram(program);

//     if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//         console.log(gl.getShaderInfoLog(vertexShader));
//         console.log(gl.getShaderInfoLog(fragmentShader));
//     }

//     return program;
// }


// const vertexShader1Source =
//     `#version 300 es

// layout(location = 0) in vec4 aPosition;
// layout(location = 1) in vec4 aColor;

// out vec4 vColor;   

// void main() {
//     vColor = aColor;
//     gl_Position = aPosition;
// }
// `;
// const fragmentShader1Source =
//     `#version 300 es

// precision mediump float;

// // uniform vec3 u_resolution;
// // uniform float u_time;

// in vec4 vColor;

// out vec4 fragColor;

// void main() {
//     fragColor = vColor;
// }
// `;


// const program1 = createProgram(gl, vertexShader1Source, fragmentShader1Source);

// const program1data = new Float32Array([
//     -.5, -.5, -.5, 0, 0, 1,
//     0.5, -.5, -.5, 0, 0, 1,
//     0.0, 0.4, -.5, 0, 0, 1,

//     -.5, 0.5, 0.5, 1, 0, 0,
//     0.5, 0.5, 0.5, 1, 0, 0,
//     0.0, -0.4, 0.5, 1, 0, 0,
// ]);

// const program1VAO = gl.createVertexArray();
// gl.bindVertexArray(program1VAO);

// const program1Buffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, program1Buffer);
// gl.bufferData(gl.ARRAY_BUFFER, program1data, gl.STATIC_DRAW);
// gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
// gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
// gl.enableVertexAttribArray(0);
// gl.enableVertexAttribArray(1);

// gl.bindVertexArray(null);



// const fragColourTexture = gl.createTexture();
// gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
// gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 600, 600);

// gl.bindTexture(gl.TEXTURE_2D, null);





// const vertexShader2Source =
//     `#version 300 es

// layout(location = 0) in vec4 aPosition;
// layout(location = 1) in vec2 aTexCoord;

// out vec2 vTexCoord;

// void main() {
//     gl_Position = aPosition;
//     vTexCoord = aTexCoord;
// }
// `;
// const fragmentShader2Source =
//     `#version 300 es

// precision mediump float;

// uniform sampler2D sampler;

// in vec2 vTexCoord;

// out vec4 fragColor;

// void main() {
//     fragColor = texture(sampler, vTexCoord);
// }
// `;

// const program2 = createProgram(gl, vertexShader2Source, fragmentShader2Source);

// const program2data = new Float32Array([
//     -1.0, 1.0, 0, 1,
//     -1.0, -1.0, 0, 0,
//     1.0, 1.0, 1, 1,
//     1.0, -1.0, 1, 0,
// ]);

// const program2VAO = gl.createVertexArray();
// gl.bindVertexArray(program2VAO);

// const program2Buffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, program2Buffer);
// gl.bufferData(gl.ARRAY_BUFFER, program2data, gl.STATIC_DRAW);
// gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
// gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
// gl.enableVertexAttribArray(0);
// gl.enableVertexAttribArray(1);

// gl.bindVertexArray(null);



// gl.useProgram(program1);
// gl.bindVertexArray(program1VAO);
// gl.enable(gl.DEPTH_TEST);
// gl.drawArrays(gl.TRIANGLES, 0, 6);
// gl.disable(gl.DEPTH_TEST);

// gl.useProgram(program2);
// gl.bindVertexArray(program2VAO);
// gl.bindTexture(gl.TEXTURE_2D, fragColourTexture);
// gl.enable(gl.BLEND);
// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
// gl.disable(gl.BLEND);
// gl.bindTexture(gl.TEXTURE_2D, null);
// gl.bindVertexArray(null);