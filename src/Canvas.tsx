import { ref, watchOnly, watchFn } from "jsx";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import { Mat4 } from "./math";
import {
  type Atlas,
  createTextureAtlas,
  loadTextureAtlas,
  renderTextToImage,
} from "./texture";
import { initInstances, QUAD_MESH, type Instances } from "./instance";

const CELL_W = 100;
const CELL_H = 30;

type CanvasProps = {
  width: number;
  height: number;
};

export default function Canvas(props: CanvasProps) {
  let canvas!: HTMLCanvasElement;
  let shaderSys!: ShaderSystem;
  let shader!: Shader;

  const [texts, setTexts] = ref<HTMLImageElement[]>([]);
  const [dbg, setDbg] = ref(false);
  const [projection, setProjection] = ref(Mat4.identity());
  const [instances, setInstances] = ref(initInstances(10));

  queueMicrotask(async () => {
    // jsx: string import
    const vert = "cell.vert";
    // jsx: string import
    const frag = "cell.frag";

    const result = await initShaderSystem(canvas, vert, frag);
    if (result instanceof Error) return console.error(result);
    shaderSys = result;

    [shader] = shaderSys.initShaders({
      drawMode: shaderSys.gl.TRIANGLE_STRIP,
      instance: instances().data,
      vertex: QUAD_MESH.vertexData,
      index: QUAD_MESH.indexData,
    });

    updateProjection();
  });

  let atlas: Atlas;
  function addText(value: string) {
    setTexts.byRefAsync(async (t) => {
      t.push(
        await renderTextToImage(value, {
          font: "24px mono",
          backgroundColor: "coral",
        }),
      );
      atlas = createTextureAtlas(t);
      console.log(atlas);
      loadTextureAtlas(shaderSys.gl);
    });
  }

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

    shaderSys.gl.clear(shaderSys.gl.COLOR_BUFFER_BIT);

    canvas.width = props.width;
    canvas.height = props.height;
    shaderSys.gl.viewport(0, 0, props.width, props.height);

    setProjection.byRef((proj) => {
      Mat4.ortho(0, props.width, 0, props.height, -1, 1000, proj);
      shaderSys.gl.uniformMatrix4fv(shaderSys.inputs.projection, false, proj);
    });
  }

  watchFn(
    () => [props.width, props.height, texts()],
    () => {
      const rows = Math.ceil(props.width / CELL_W);
      if (!rows) return;
      const cols = Math.ceil(props.height / CELL_H);
      if (!cols) return;

      setInstances.byRef((inst) => {
        inst.resize(rows + cols + texts().length + 1);

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

        for (let i = 0; i < texts().length; i++) {
          const t = atlas.dimensions[i];
          const uv = atlas.uvCoords.subarray(i * 4, i * 4 + 4);
          console.log(JSON.stringify({ t, uv }, null, 2));
          inst.hasUVAt(rows + cols + i)[0] = 1;
          inst.colorAt(rows + cols + i).set([0, 0, 0]);
          inst.uvAt(rows + cols + i).set(uv);
          const model = inst.modelAt(rows + cols + i);
          Mat4.scaleIdentity(model, t.width, t.height, 1);
          Mat4.translateTo(
            model,
            (props.width - t.width) / 2,
            (props.height - t.height) / 2 + t.height * i,
            100,
          );
        }
        if (atlas) {
          const i = texts().length;
          const t = atlas.dimensions[0];
          inst.hasUVAt(rows + cols + i)[0] = 1;
          inst.colorAt(rows + cols + i).set([0, 0, 0]);
          inst.uvAt(rows + cols + i).set([0, 1, 1, 0]);
          const model = inst.modelAt(rows + cols + i);
          console.log(JSON.stringify(atlas));
          Mat4.scaleIdentity(model, t.width, t.height, 1);
          Mat4.translateTo(
            model,
            (props.width - t.width) / 2,
            (props.height - t.height) / 2 + t.height * i,
            100,
          );
        }

        if (shader && shaderSys) {
          shaderSys?.resizeInstances(shader, inst.data);
        }
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
      <input
        class="absolute left-0 top-10 z-10"
        on:change={(e) => addText(e.currentTarget.value)}
      />
      <pre
        class="absolute left-0 top-0 p-2 bg-zinc-900/75 text-zinc-100 font-mono max-h-dvh overflow-auto"
        class:hidden={!dbg()}
      >
        Model: <br />
        {Mat4.toString(instances().modelAt(instIdx))}
        <br /> <br />
        Projection: <br />
        {Mat4.toString(projection())}
      </pre>
    </>
  );
}
