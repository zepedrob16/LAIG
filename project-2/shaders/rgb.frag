#ifdef GL_ES
precision highp float;
#endif

uniform float rgb_r;
uniform float rgb_g;
uniform float rgb_b;


void main() {
	gl_FragColor = vec4(rgb_r, rgb_g, rgb_b, 1.0);
}