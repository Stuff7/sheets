import { ref, watchOnly } from "jsx";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import { aligned, Mat4 } from "./math";
import {
  type Atlas,
  type TileMap,
  createTextureAtlas,
  loadTextureAtlas,
  renderTextToImage,
} from "./texture";
import { initInstances, QUAD_MESH, type Instances } from "./instance";

const SCROLL_SPEED = 200; // Less is faster
const CELL_W = 100;
const CELL_H = 30;

export const [contentWidth, setContentWidth] = ref(0);
export const [contentHeight, setContentHeight] = ref(0);

type CellMap = Record<
  number,
  { text: string; width: number; height: number; x: number; y: number }
>;

export default function Canvas() {
  let canvas!: HTMLCanvasElement;
  let shaderSys!: ShaderSystem;
  let shader!: Shader;
  let atlas: Atlas;
  let content!: HTMLElement;
  let cellInput!: HTMLInputElement;

  const tiles: TileMap = {};
  const [scroll, setScroll] = ref({ x: 0, y: 0 });
  const [cells, setCells] = ref<CellMap>({});
  const [dbg, setDbg] = ref(false);
  const [projection, setProjection] = ref(Mat4.identity());
  const [instances, setInstances] = ref(initInstances(10));

  queueMicrotask(async () => {
    const observer = new ResizeObserver(([e]) => {
      const w = e.borderBoxSize[0].inlineSize;
      const h = e.borderBoxSize[0].blockSize;
      if (contentWidth() !== w) setContentWidth(w);
      if (contentHeight() !== h) setContentHeight(h);
    });

    observer.observe(content);

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

  function addText(value: string) {
    if (!value) return;
    setCells.byRefAsync(async (c) => {
      const hasKey = value in tiles;

      tiles[value] =
        tiles[value] ??
        (await renderTextToImage(value, {
          font: "16px mono",
        }));

      c[Object.keys(c).length] = {
        text: value,
        width: tiles[value].width,
        height: tiles[value].height,
        x: cellPos().x,
        y: cellPos().y,
      };

      if (hasKey) return;

      atlas = createTextureAtlas(tiles);
      console.log(JSON.stringify(atlas, null, 1));
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
    }
  }

  function updateProjection() {
    if (!shaderSys) return;

    shaderSys.gl.clear(shaderSys.gl.COLOR_BUFFER_BIT);

    canvas.width = contentWidth();
    canvas.height = contentHeight();
    shaderSys.gl.viewport(0, 0, contentWidth(), contentHeight());

    setProjection.byRef((proj) => {
      Mat4.ortho(0, contentWidth(), contentHeight(), 0, -1, 1000, proj);
      shaderSys.gl.uniformMatrix4fv(shaderSys.inputs.projection, false, proj);
    });
  }

  const [cellPos, setCellPos] = ref({ x: 0, y: 0 });
  function selectCell(ev: MouseEvent) {
    setCellPos.byRef((pos) => {
      pos.x = aligned(ev.offsetX, CELL_W);
      pos.y = aligned(ev.offsetY, CELL_H);
    });
    cellInput.focus();
  }

  watchOnly([contentWidth, contentHeight, cells], (v) => {
    const rows = Math.ceil(contentWidth() / CELL_W);
    if (!rows) return;
    const cols = Math.ceil(contentHeight() / CELL_H);
    if (!cols) return;

    setInstances.byRef((inst) => {
      const numCells = Object.keys(cells()).length;
      inst.resize(rows + cols + numCells + 1);

      for (let i = 0; i < rows; i++) {
        const model = inst.modelAt(i);
        Mat4.scaleIdentity(model, 1, contentHeight(), 1);
        Mat4.translateTo(model, i * CELL_W, 0, 0);
        inst.colorAt(i).set([1, 1, 1]);
        inst.hasUVAt(i)[0] = 0;
      }

      for (let i = 0; i < cols; i++) {
        const model = inst.modelAt(i + rows);
        Mat4.scaleIdentity(model, contentWidth(), 1, 1);
        Mat4.translateTo(model, 0, i * CELL_H, 0);
        inst.colorAt(i + rows).set([1, 1, 1]);
        inst.hasUVAt(i + rows)[0] = 0;
      }

      let i = 0;
      for (const k in cells()) {
        const c = cells()[k];
        const uv = atlas.uvCoords[c.text];
        inst.hasUVAt(rows + cols + i)[0] = 1;
        inst.colorAt(rows + cols + i).set([0, 0, 0]);
        inst.uvAt(rows + cols + i).set(uv);
        const model = inst.modelAt(rows + cols + i);
        Mat4.scaleIdentity(model, c.width, c.height, 1);
        Mat4.translateTo(model, c.x, c.y, 100);
        i++;
      }

      if (atlas) {
        const i = numCells;
        inst.hasUVAt(rows + cols + i)[0] = 1;
        inst.colorAt(rows + cols + i).set([0, 0, 0]);
        inst.uvAt(rows + cols + i).set([0, 0, 1, 1]);
        const model = inst.modelAt(rows + cols + i);
        Mat4.scaleIdentity(model, atlas.width, atlas.height, 1);
        Mat4.translateTo(model, 0, 0, 100);
      }

      if (shader && shaderSys) {
        shaderSys?.resizeInstances(shader, inst.data);
      }
    });

    if (typeof v === "number") updateProjection();
  });

  watchOnly([projection, instances], () => {
    shaderSys?.draw();
  });

  watchOnly([scroll], () => {
    setProjection.byRef((proj) => {
      Mat4.translateTo(
        proj,
        -1 + scroll().x / SCROLL_SPEED,
        1 + scroll().y / SCROLL_SPEED,
        -1,
      );
      shaderSys?.gl.uniformMatrix4fv(shaderSys.inputs.projection, false, proj);
    });
  });

  return (
    <article $ref={content} class="relative overflow-hidden">
      <canvas $ref={canvas} g:onkeydown={keyListener} class="w-full h-full" />
      <input
        $ref={cellInput}
        class="absolute z-10 h-8 w-25"
        style:left={`${cellPos().x}px`}
        style:top={`${cellPos().y}px`}
        on:change={(e) => addText(e.currentTarget.value)}
      />
      <pre
        class="absolute left-0 top-0 z-100 p-2 bg-zinc-900/75 text-zinc-100 font-mono max-h-dvh overflow-auto"
        class:hidden={!dbg()}
      >
        Model: <br />
        {Mat4.toString(instances().modelAt(instIdx))}
        <br /> <br />
        Projection: <br />
        {Mat4.toString(projection())}
        <br /> <br />
        Scroll: {scroll().x} {scroll().y}
      </pre>
      <div
        class="overflow-y-auto absolute left-0 right-0 top-0 h-[calc(100dvh-var(--spacing)*10)]"
        on:click={selectCell}
        on:scroll={(ev) =>
          setScroll({
            x: ev.currentTarget.scrollLeft,
            y: ev.currentTarget.scrollTop,
          })
        }
      >
        <div class="w-full h-1000" />
      </div>
    </article>
  );
}
