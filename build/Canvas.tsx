import { template as _jsx$template } from "jsx";

const _jsx$templ0 = _jsx$template(`<canvas class="w-full h-full"></canvas>`);

import { watch, watchOnly } from "jsx";
import {
  setCanvasRect,
  instances,
  prefersDark,
  projection,
  canvasRect,
  scroll,
  setProjection,
} from "./state";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import { Mat4 } from "./math";
import { QUAD_MESH } from "./instance";

let canvas!: HTMLCanvasElement;
let shaderSys!: ShaderSystem;
let shader!: Shader;

export const getGL = () => shaderSys.gl;

export function resizeInstances(data: Float32Array) {
  if (!shader || !shaderSys) return;
  shaderSys.resizeInstances(shader, data);
}

export default function Canvas() {
  queueMicrotask(async () => {
    const observer = new ResizeObserver(() =>
      setCanvasRect(canvas.getBoundingClientRect()),
    );

    observer.observe(canvas);

    // jsx: string import
    const vert = `#version 300 es

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
`;
    // jsx: string import
    const frag = `#version 300 es
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
`;

    shaderSys = (await initShaderSystem(canvas, vert, frag, {
      drawMode: "TRIANGLE_STRIP",
      instance: instances().data,
      vertex: QUAD_MESH.vertexData,
      index: QUAD_MESH.indexData,
    })) as ShaderSystem;
    if (shaderSys instanceof Error) return console.error(shaderSys);
    shader = shaderSys.shader;

    updateProjection();
    shaderSys.render();
  });

  watch(() => {
    if (prefersDark()) {
      shaderSys?.gl.clearColor(0, 0, 0, 0);
    } else {
      shaderSys?.gl.clearColor(0, 0, 0, 0);
    }
  });

  watchOnly([prefersDark, projection, instances], () => {
    shaderSys?.requestRedraw();
  });

  watchOnly([canvasRect, scroll], () => updateProjection());

  function updateProjection() {
    const { width, height } = canvasRect();
    if (!shaderSys || !width || !height) return;

    shaderSys.gl.clear(shaderSys.gl.COLOR_BUFFER_BIT);

    canvas.width = width;
    canvas.height = height;
    shaderSys.gl.viewport(0, 0, width, height);

    setProjection.byRef((proj) => {
      Mat4.ortho(0, width, height, 0, -1, 1000, proj);
      const s = scroll();
      if (s.x || s.y) {
        Mat4.translatePx(proj, -s.x, -s.y, 0);
      }
      shaderSys.gl.uniformMatrix4fv(shaderSys.inputs.projection, false, proj);
    });
  }

  return (() => {
const _jsx$el0 = _jsx$templ0(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]

canvas = _jsx$el0;

return _jsx$el0;
})();
}
