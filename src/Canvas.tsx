import { ref, watchOnly, watchFn } from "jsx";
import {
  initShaderSystem,
  initWebGL,
  type ShaderSystem,
  type Shader,
} from "./gl";
import { Mat4 } from "./math";
import { loadTexture, renderTextToImage } from "./texture";
import { initInstances, QUAD_MESH, type Instances } from "./instance";

type CanvasProps = {
  width: number;
  height: number;
};

export default function Canvas(props: CanvasProps) {
  let canvas!: HTMLCanvasElement;
  let gl!: WebGL2RenderingContext;
  let shader!: Shader;
  let shaderSys!: ShaderSystem;
  let text!: HTMLImageElement;

  const [dbg, setDbg] = ref(false);
  const [projection, setProjection] = ref(Mat4.identity());
  const [instances, setInstances] = ref(initInstances(10));

  queueMicrotask(async () => {
    // jsx: string import
    const vert = "cell.vert";
    // jsx: string import
    const frag = "cell.frag";

    const result = initWebGL(canvas, vert, frag);

    if (result instanceof Error) return console.error(result);

    gl = result.gl;

    text = await renderTextToImage("Hello World!", {
      font: "32px mono",
      fillStyle: "white",
    });

    loadTexture(gl, text);
    shaderSys = (await initShaderSystem(gl, result.program)) as ShaderSystem;

    if (shaderSys instanceof Error) return;

    [shader] = shaderSys.initShaders({
      drawMode: gl.TRIANGLE_STRIP,
      instance: instances().data,
      vertex: QUAD_MESH.vertexData,
      index: QUAD_MESH.indexData,
    });
    console.log(shaderSys);

    updateProjection();
  });

  let instIdx = 0;
  function translateInstance(
    inst: Instances,
    tx: number,
    ty: number,
    tz: number,
  ) {
    const model = inst.modelAt(instIdx);
    Mat4.translate(model, tx, ty, tz);
    shaderSys.updateInstance(shader, instIdx, model);
  }

  function keyListener(ev: KeyboardEvent) {
    const k = ev.key.toUpperCase();
    const speed = 10;

    if (k === "W") {
      setInstances.byRef((inst) => translateInstance(inst, 0, speed, 0));
    } else if (k === "A") {
      setInstances.byRef((inst) => translateInstance(inst, -speed, 0, 0));
    } else if (k === "S") {
      setInstances.byRef((inst) => translateInstance(inst, 0, -speed, 0));
    } else if (k === "D") {
      setInstances.byRef((inst) => translateInstance(inst, speed, 0, 0));
    } else if (k === "?") {
      setDbg(!dbg());
    } else {
      const n = Number.parseInt(k, 10);
      if (!Number.isNaN(n)) instIdx = n;
      console.log("KEY", k);
    }
  }

  function updateProjection() {
    if (!shaderSys) return;

    gl.clear(gl.COLOR_BUFFER_BIT);

    canvas.width = props.width;
    canvas.height = props.height;
    gl.viewport(0, 0, props.width, props.height);

    setProjection.byRef((proj) => {
      Mat4.ortho(0, props.width, 0, props.height, -1, 1000, proj);
      gl.uniformMatrix4fv(shaderSys.inputs.projection, false, proj);
    });
  }

  watchFn(
    () => [props.width, props.height],
    () => {
      const rows = Math.ceil(props.width / CELL_W);
      if (!rows) return;
      const cols = Math.ceil(props.height / CELL_H);
      if (!cols) return;

      setInstances.byRef((inst) => {
        inst.resize(rows + cols + 1);

        for (let i = 0; i < rows; i++) {
          const model = inst.modelAt(i);
          Mat4.scaleIdentity(model, 1, props.height, 1);
          Mat4.translateTo(model, i * CELL_W, 0, 0);
          inst.colorAt(i).set([1, 1, 1]);
          inst.hasUVAt(i)[0] = 0;
        }

        for (let i = 0; i < cols; i++) {
          const model = inst.modelAt(i + rows);
          Mat4.scaleIdentity(model, props.width, 1, 1);
          Mat4.translateTo(model, 0, i * CELL_H, 0);
          inst.colorAt(i + rows).set([1, 1, 1]);
          inst.hasUVAt(i + rows)[0] = 0;
        }

        if (text) {
          inst.hasUVAt(rows + cols)[0] = 1;
          inst.colorAt(rows + cols).set([0, 0, 0]);
          const model = inst.modelAt(rows + cols);
          Mat4.scale(model, text.width, text.height, 1);
          Mat4.translate(
            model,
            (props.width - text.width) / 2,
            (props.height - text.height) / 2,
            100,
          );
        }

        shaderSys?.resizeInstances(shader, inst.data);
      });

      updateProjection();
    },
  );

  watchOnly([projection, instances], () => {
    shaderSys?.draw();
  });

  return (
    <>
      <canvas $ref={canvas} g:onkeydown={keyListener} class="w-full h-full" />
      <pre
        class="absolute left-0 top-0 p-2 bg-zinc-900/75 text-zinc-100 font-mono max-h-dvh overflow-auto"
        class:hidden={!dbg()}
      >
        QdModel: <br />
        {Mat4.toString(instances().modelAt(instIdx))}
        <br /> <br />
        Projection: <br />
        {Mat4.toString(projection())}
      </pre>
    </>
  );
}

const CELL_W = 100;
const CELL_H = 30;
