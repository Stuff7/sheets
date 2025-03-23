import { watch, ref, watchOnly, watchFn } from "jsx";
import {
  initShaderSystem,
  initWebGL,
  type ShaderSystem,
  type Shader,
} from "./gl";
import { formatMatrix, formatVec, identity, ortho } from "./math";

type CanvasProps = {
  width: number;
  height: number;
};

export default function Canvas(props: CanvasProps) {
  const canvasUnits = 100;
  let canvas!: HTMLCanvasElement;
  let gl!: WebGL2RenderingContext;
  let lineShader!: Shader;
  let quadShader!: Shader;
  let shaderSys!: ShaderSystem;

  const [dbg, setDbg] = ref(false);
  const [aspectRatio, setAspectRatio] = ref(0);
  const [projection, setProjection] = ref(identity());
  // biome-ignore format:
  const [lineTransforms, setLineTransforms] = ref<Float32Array>(new Float32Array([
    1, 0,
    3, 0,
    5, 0,
    7, 0,
    10, 0,
  ]));
  // biome-ignore format:
  const [quadTransforms, setQuadTransforms] = ref(new Float32Array([
    15, 0,
    60, 0,
  ]));

  watch(() => {
    if (props.height) setAspectRatio(props.width / props.height);
  });

  queueMicrotask(async () => {
    // jsx: string import
    const vert = "line.vert";
    // jsx: string import
    const frag = "line.frag";

    const result = initWebGL(canvas, vert, frag);

    if (result instanceof Error) return console.error(result);

    gl = result.gl;

    shaderSys = initShaderSystem(gl, result.program) as ShaderSystem;
    if (shaderSys instanceof Error) return;

    // biome-ignore format:
    const lineVertices = new Float32Array([
      0, 0, 1, 1, 0,
      0, 100, 1, 0, 0,
    ]);
    const lineIndices = new Uint16Array([0, 1]);

    // biome-ignore format:
    const quadVertices = new Float32Array([
      0, 0, 1, 1, 0,
      40, 0, 0, 1, 0,
      40, 20, 0, 1, 1,
      0, 20, 1, 0, 1,
    ]);
    const quadIndices = new Uint16Array([0, 1, 2, 2, 3, 0]);

    [lineShader, quadShader] = shaderSys.initShaders(
      {
        drawMode: gl.LINES,
        instance: lineTransforms(),
        index: lineIndices,
        vertex: lineVertices,
      },
      {
        drawMode: gl.TRIANGLE_STRIP,
        instance: quadTransforms(),
        index: quadIndices,
        vertex: quadVertices,
      },
    );
    console.log(lineShader, quadShader);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    updateProjection();
  });

  function keyListener(ev: KeyboardEvent) {
    const k = ev.key.toUpperCase();
    if (k === "A") {
      setLineTransforms(shaderSys.updateInstance(lineShader, 0, -1, 0));
    } else if (k === "D") {
      setLineTransforms(shaderSys.updateInstance(lineShader, 0, 1, 0));
    } else if (k === "?") {
      setDbg(!dbg());
    }
  }

  function updateProjection() {
    if (!shaderSys) return;

    gl.clear(gl.COLOR_BUFFER_BIT);

    canvas.width = props.width;
    canvas.height = props.height;
    gl.viewport(0, 0, props.width, props.height);

    setProjection.byRef((proj) => {
      ortho(0, canvasUnits * aspectRatio(), 0, canvasUnits, -1, 1, proj);
      gl.uniformMatrix4fv(shaderSys.inputs.projection, false, proj);
    });
  }

  watchFn(aspectRatio, updateProjection);

  watchOnly([projection, lineTransforms], () => {
    if (gl) shaderSys.draw();
  });

  return (
    <>
      <canvas $ref={canvas} g:onkeydown={keyListener} class="w-full h-full" />
      <pre
        class="absolute left-0 top-0 p-2 bg-zinc-900/75 font-mono max-h-dvh overflow-auto"
        class:hidden={!dbg()}
      >
        Transforms: <br />
        {formatVec(lineTransforms())}
        <br /> <br />
        Projection: <br />
        {formatMatrix(projection())}
      </pre>
    </>
  );
}
