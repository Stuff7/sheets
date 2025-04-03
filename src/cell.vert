#version 300 es

in vec2 position;

in mat4 instModel;
in vec4 instColor;
in vec4 instUV;
in float instHasUV;

uniform mat4 projection;

out vec4 vertColor;
out vec2 fragUV;
out float hasUV;

void main() {
  vertColor = instColor;
  fragUV = mix(instUV.xy, instUV.zw, position);
  hasUV = instHasUV;
  gl_Position = projection * instModel * vec4(position, 0.0, 1.0);
}
