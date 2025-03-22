#version 300 es

in vec2 position;
in vec2 translation;

uniform mat4 projection;

void main() {
  gl_Position = projection * vec4(position + translation, 0.0, 1.0);
}
