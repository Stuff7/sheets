#version 300 es

in vec2 position;

in mat4 instModel;
in vec3 instColor;
in float instHasUV;
in vec4 instUV;

uniform mat4 projection;

out vec4 vertColor;
out vec2 fragUV;
out float hasUV;

void main() {
  vertColor = vec4(instColor, 1.0);
  fragUV = mix(instUV.xy, instUV.zw, position);
  hasUV = instHasUV;
  gl_Position = projection * instModel * vec4(position, 0.0, 1.0);
}
