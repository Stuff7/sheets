import { watch, ref, watchOnly, watchFn } from "jsx";
import { initWebGL } from "./gl";
import { formatMatrix, formatVec, identity, ortho } from "./math";

type CanvasProps = {
  width: number;
  height: number;
};

export default function Canvas(props: CanvasProps) {
  let canvas!: HTMLCanvasElement;
  let gl!: WebGL2RenderingContext;
  let projectionUniform: WebGLUniformLocation | null;
  const canvasUnits = 100;
  let translationBuffer!: WebGLBuffer;

  const [dbg, setDbg] = ref(false);
  const [aspectRatio, setAspectRatio] = ref(0);
  const [projection, setProjection] = ref(identity());
  // biome-ignore format:
  const [translations, setTranslations] = ref(new Float32Array([
    5, 0,
    10, 0,
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

    // biome-ignore format:
    const vertices = new Float32Array([
      0, 0,
      0, 100,
    ]);

    const positionAttr = gl.getAttribLocation(result.program, "position");
    const translationAttr = gl.getAttribLocation(result.program, "translation");

    projectionUniform = gl.getUniformLocation(result.program, "projection");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 0, 0);

    translationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, translations(), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(translationAttr);
    gl.vertexAttribPointer(translationAttr, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(translationAttr, 1);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    updateProjection();
  });

  function keyListener(ev: KeyboardEvent) {
    const k = ev.key.toUpperCase();
    if (k === "A") {
      updateInstance(0, -1, 0);
    } else if (k === "D") {
      updateInstance(0, 1, 0);
    } else if (k === "?") {
      setDbg(!dbg());
    }
  }

  function updateInstance(index: number, x: number, y: number) {
    setTranslations.byRef((t) => {
      t[index * 2] += x;
      t[index * 2 + 1] += y;

      gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        index * 16,
        t.subarray(index * 4, index * 4 + 4),
      );
    });
  }

  function updateProjection() {
    if (!projectionUniform) return;

    gl.clear(gl.COLOR_BUFFER_BIT);

    canvas.width = props.width;
    canvas.height = props.height;
    gl.viewport(0, 0, props.width, props.height);

    setProjection.byRef((proj) => {
      ortho(0, canvasUnits * aspectRatio(), 0, canvasUnits, -1, 1, proj);
      gl.uniformMatrix4fv(projectionUniform, false, proj);
    });
  }

  watchFn(aspectRatio, updateProjection);

  watchOnly([projection, translations], () => {
    gl?.clear(gl.COLOR_BUFFER_BIT);
    gl?.drawArraysInstanced(gl.LINES, 0, 2, 2);
  });

  return (
    <>
      <canvas $ref={canvas} g:onkeydown={keyListener} class="w-full h-full" />
      <pre
        class="absolute left-0 top-0 p-2 bg-zinc-900/75 font-mono max-h-dvh overflow-auto"
        class:hidden={!dbg()}
      >
        Translations: <br />
        {formatVec(translations())}
        <br /> <br />
        Projection: <br />
        {formatMatrix(projection())}
      </pre>
    </>
  );
}
