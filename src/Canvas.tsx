import Dbg from "./Dbg";
import {
  setCanvasRect,
  instances,
  prefersDark,
  projection,
  canvasRect,
  scroll,
  setProjection,
  selectedCells,
  customCells,
} from "./state";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import { Mat4 } from "./math";
import { QUAD_MESH } from "./instance";
import { watch, watchOnly } from "jsx";

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
    const vert = "cell.vert";
    // jsx: string import
    const frag = "cell.frag";

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

  return (
    <>
      <canvas $ref={canvas} class="w-full h-full" />
      <Dbg>
        <p>
          Projection: <br />
          {Mat4.toString(projection())}
        </p>
        <p>SelectedCells: {JSON.stringify(selectedCells())}</p>
        <p>Cells: {JSON.stringify(customCells())}</p>
        <p>
          Scroll: {scroll().x} {scroll().y}
        </p>
      </Dbg>
    </>
  );
}
