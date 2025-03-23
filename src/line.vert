#version 300 es

in vec2 position;
in vec3 color;

// per instance
in vec2 transform;

uniform mat4 projection;

out vec3 vertColor;

void main() {
  vertColor = color;
  gl_Position = projection * vec4(position + transform, 0.0, 1.0);
}
