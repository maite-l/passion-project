#version 300 es

precision highp float;

uniform vec3 u_resolution;
uniform float u_time;

out vec4 outColor;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898f, 78.233f))) *
        43758.5453123f);
}
float box(in vec2 _st, in vec2 _size) {
    _size = vec2(0.5f) - _size * 0.5f;
    vec2 uv = smoothstep(_size, _size + vec2(0.001f), _st);
    uv *= smoothstep(_size, _size + vec2(0.001f), vec2(1.0f) - _st);
    return uv.x * uv.y;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x -= 0.125f;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 color = vec3(0.f);

    vec3 border1 = 1.f - vec3(box(st, vec2(0.9f)));
    vec3 border2 = 1.f - vec3(box(st, vec2(0.9f)));
    border2 -= 1.f - vec3(box(st, vec2(0.915f)));

    st *= 4.f;
    st += vec2(u_time / 5.f, u_time / 2.f);
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);

    for(int i = 0; i < 2; i++) {
        if(random(ipos) < 0.3f) {
            st *= 2.0f;
            ipos = floor(st);
            fpos = fract(st);
            float size = 1.f - float(i + 1) / 20.f;
            color = vec3(box(fpos, vec2(size))) * vec3(0.798f, 0.971f, 1.000f);

            for(int j = 1; j < 2; j++) {
                if(random(ipos) < 0.3f) {
                    st *= 2.0f;
                    ipos = floor(st);
                    fpos = fract(st);
                    size = 1.f - float(j + 1) / 10.f;
                    color = vec3(box(fpos, vec2(size))) * vec3(0.798f, 0.971f, 1.000f);
                } else if(random(ipos) < 0.9f) {
                    color = vec3(box(fpos, vec2(size))) * vec3(0.798f, 0.971f, 1.000f);
                } else {
                    color = vec3(0.f);
                }
            }

        } else if(random(ipos) < 0.9f) {
            float size = 1.f - 0.5f * float(i + 1) / 20.f;
            color = vec3(box(fpos, vec2(0.98f))) * vec3(0.798f, 0.971f, 1.000f);
        } else {
            color = vec3(0.f);
        }
    }

    color = mix(color, vec3(0.798f, 0.971f, 1.000f), border1);
    color = mix(color, vec3(0.0f), border2);

    outColor = vec4(color, 1.0f);
}