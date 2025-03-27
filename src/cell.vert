#version 300 es

in vec2 position;
in vec2 uv;

in mat4 instModel;
in vec3 instColor;
in float instHasUV;

uniform mat4 projection;

out vec4 vertColor;
out vec2 fragUV;
out float hasUV;

void main() {
  vertColor = vec4(instColor, 1.0);
  fragUV = uv;
  hasUV = instHasUV;
  gl_Position = projection * instModel * vec4(position, 0.0, 1.0);
}
