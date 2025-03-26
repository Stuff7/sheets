import { ref, watchOnly, watchFn } from "jsx";
import {
  initShaderSystem,
  initWebGL,
  type ShaderSystem,
  type Shader,
} from "./gl";
import { Mat4 } from "./math";
import { loadTexture, renderTextToImage } from "./texture";
import {
  initInstances,
  LINE_MESH,
  QUAD_MESH,
  type Instances,
} from "./instance";

type CanvasProps = {
  width: number;
  height: number;
};

export default function Canvas(props: CanvasProps) {
  let canvas!: HTMLCanvasElement;
  let gl!: WebGL2RenderingContext;
  let lineShader!: Shader;
  let quadShader!: Shader;
  let shaderSys!: ShaderSystem;

  const [dbg, setDbg] = ref(false);
  const [projection, setProjection] = ref(Mat4.identity());
  // biome-ignore format:
  const [lineInstances, setLineInstances] = ref(initInstances(5));
  // biome-ignore format:
  const [quadInstances, setQuadInstances] = ref(initInstances(3));

  queueMicrotask(async () => {
    // jsx: string import
    const vert = "cell.vert";
    // jsx: string import
    const frag = "cell.frag";

    const result = initWebGL(canvas, vert, frag);

    if (result instanceof Error) return console.error(result);

    gl = result.gl;

    const text = await renderTextToImage("Hello World!", {
      font: "32px mono",
      fillStyle: "white",
    });

    loadTexture(gl, text);
    shaderSys = (await initShaderSystem(gl, result.program)) as ShaderSystem;

    if (shaderSys instanceof Error) return;

    setLineInstances.byRef((inst) => {
      for (let i = 0; i < inst.len; i++) {
        const model = inst.modelAt(i);
        Mat4.scale(model, 1, 2000, 1);
        Mat4.translate(model, i * 50, 0, 0);
      }
    });

    setQuadInstances.byRef((inst) => {
      for (let i = 1; i < inst.len; i++) {
        const model = inst.modelAt(i);
        Mat4.scale(model, text.width, 50, 1);
        Mat4.translate(model, i * text.width, 0, 0);
      }
      inst.hasUVAt(0)[0] = 1;
      const model = inst.modelAt(0);
      Mat4.scale(model, text.width, text.height, 1);
      Mat4.translate(model, 0, 0, 100);
    });

    [lineShader, quadShader] = shaderSys.initShaders(
      {
        drawMode: gl.LINES,
        instance: lineInstances().data,
        vertex: LINE_MESH.vertexData,
        index: LINE_MESH.indexData,
      },
      {
        drawMode: gl.TRIANGLE_STRIP,
        instance: quadInstances().data,
        vertex: QUAD_MESH.vertexData,
        index: QUAD_MESH.indexData,
      },
    );
    console.log(shaderSys);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    updateProjection();
  });

  let instIdx = 0;
  function translateInstance(
    inst: Instances,
    shader: Shader,
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
      setLineInstances.byRef((inst) =>
        translateInstance(inst, lineShader, 0, speed, 0),
      );
    } else if (k === "A") {
      setLineInstances.byRef((inst) =>
        translateInstance(inst, lineShader, -speed, 0, 0),
      );
    } else if (k === "S") {
      setLineInstances.byRef((inst) =>
        translateInstance(inst, lineShader, 0, -speed, 0),
      );
    } else if (k === "D") {
      setLineInstances.byRef((inst) =>
        translateInstance(inst, lineShader, speed, 0, 0),
      );
    } else if (k === "ARROWUP") {
      setQuadInstances.byRef((inst) =>
        translateInstance(inst, quadShader, 0, speed, 0),
      );
    } else if (k === "ARROWLEFT") {
      setQuadInstances.byRef((inst) =>
        translateInstance(inst, quadShader, -speed, 0, 0),
      );
    } else if (k === "ARROWDOWN") {
      setQuadInstances.byRef((inst) =>
        translateInstance(inst, quadShader, 0, -speed, 0),
      );
    } else if (k === "ARROWRIGHT") {
      setQuadInstances.byRef((inst) =>
        translateInstance(inst, quadShader, speed, 0, 0),
      );
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

  watchFn(() => [props.width, props.height], updateProjection);

  watchOnly([projection, lineInstances, quadInstances], () => {
    if (gl) shaderSys.draw();
  });

  return (
    <>
      <canvas $ref={canvas} g:onkeydown={keyListener} class="w-full h-full" />
      <pre
        class="absolute left-0 top-0 p-2 bg-zinc-900/75 text-zinc-100 font-mono max-h-dvh overflow-auto"
        class:hidden={!dbg()}
      >
        LnModel: <br />
        {Mat4.toString(lineInstances().modelAt(instIdx))}
        <br /> <br />
        QdModel: <br />
        {Mat4.toString(quadInstances().modelAt(instIdx))}
        <br /> <br />
        Projection: <br />
        {Mat4.toString(projection())}
      </pre>
    </>
  );
}
