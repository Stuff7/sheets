import { watch, ref, watchFn } from "jsx";
import { initWebGL } from "./gl";
import { identity, ortho } from "./math";

type CanvasProps = {
  width: number;
  height: number;
};

export default function Canvas(props: CanvasProps) {
  let canvas!: HTMLCanvasElement;
  let gl!: WebGLRenderingContext;
  let projectionUniform: WebGLUniformLocation | null;
  const canvasUnits = 100;
  const projection = identity();
  const [aspectRatio, setAspectRatio] = ref(0);

  watch(() => {
    if (props.height) setAspectRatio(props.width / props.height);
  });

  queueMicrotask(async () => {
    const result = initWebGL(
      canvas,
      await (await fetch("/solid.vert")).text(),
      await (await fetch("/solid.frag")).text(),
    );

    if (result instanceof Error) return console.error(result);

    gl = result.gl;

    // biome-ignore format:
    const vertices = new Float32Array([
      50, 75, 0,
      25, 25, 0,
      75, 25, 0,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionAttr = gl.getAttribLocation(result.program, "pos");
    gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttr);

    projectionUniform = gl.getUniformLocation(result.program, "proj");
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    updateProjection();
    drawScene();
  });

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(drawScene);
  }

  function updateProjection() {
    if (!projectionUniform) return;
    gl.viewport(0, 0, props.width, props.height);
    ortho(0, canvasUnits * aspectRatio(), 0, canvasUnits, -1, 1, projection);
    gl.uniformMatrix4fv(projectionUniform, false, projection);
  }

  watchFn(aspectRatio, updateProjection);

  return (
    <canvas
      $ref={canvas}
      class="w-full h-full"
      $width={props.width}
      $height={props.height}
    />
  );
}
