#version 300 es
precision mediump float;

in vec4 vertColor;
in vec2 fragUV;
in float hasUV;

uniform sampler2D sampler;

out vec4 fragColor;

void main() {
  float useTexture = hasUV * step(0.0, fragUV.x) * step(0.0, fragUV.y);
  fragColor = mix(vertColor, texture(sampler, fragUV), useTexture);
}
