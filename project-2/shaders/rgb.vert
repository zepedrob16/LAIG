#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float normScale;
uniform float amplitude;

void main() {

	vec3 pos = aVertexPosition + aVertexNormal * vec3(normScale * amplitude);
	gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
