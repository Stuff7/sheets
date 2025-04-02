import { ref, watch, watchOnly } from "jsx";
import For from "jsx/components/For";
import Dbg from "./Dbg";
import { canvasRect, setCanvasRect, prefersDark } from "./state";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import { aligned, asciiNumParser, getMousePosition } from "./utils";
import { Mat4 } from "./math";
import {
  type Atlas,
  type TileMap,
  createTextureAtlas,
  loadTextureAtlas,
  renderTextToImage,
} from "./texture";
import { initInstances, QUAD_MESH, type Instances } from "./instance";

const MAX_COLS = 1e5;
const MAX_ROWS = 2e5;
const CELL_W = 100;
const CELL_H = 30;

const COLOR_GRID_LINE_DARK = [0.25, 0.25, 0.27] as const; // zinc-700 #3f3f46
const COLOR_GRID_LINE_LIGHT = [0.89, 0.89, 0.91] as const; // zinc-200 #e4e4e7
const COLOR_CELL_DARK = [0.09, 0.09, 0.11] as const; // zinc-900 #18181b
const COLOR_CELL_LIGHT = [0.98, 0.98, 0.98] as const; // zinc-50 #fafafa

const CELL_HEADER_DARK =
  "dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-emerald-400 dark:active:bg-emerald-100 dark:hover:text-zinc-800";
const CELL_HEADER_LIGHT =
  "border-zinc-300 bg-zinc-200 hover:bg-indigo-700 active:bg-indigo-900 hover:text-zinc-200";
const CELL_HEADER_STYLE = `border min-w-[56.5px] ${CELL_HEADER_DARK} ${CELL_HEADER_LIGHT}`;

const [toAlphaUpper] = asciiNumParser(26, "A".charCodeAt(0));
const [toAlphaLower] = asciiNumParser(26, "a".charCodeAt(0));

type CellMap = Record<
  number,
  { text: string; width: number; height: number; x: number; y: number }
>;

export default function Canvas() {
  let canvas!: HTMLCanvasElement;
  let shaderSys!: ShaderSystem;
  let shader!: Shader;
  let atlas: Atlas;
  let cellInput!: HTMLInputElement;

  const tiles: TileMap = {};
  const [scroll, setScroll] = ref({ x: 0, y: 0 });
  const [cells, setCells] = ref<CellMap>({});
  const [dbg, setDbg] = ref(false);
  const [projection, setProjection] = ref(Mat4.identity());
  const [instances, setInstances] = ref(initInstances(10));

  queueMicrotask(async () => {
    const observer = new ResizeObserver(() =>
      setCanvasRect(canvas.getBoundingClientRect()),
    );

    observer.observe(canvas);

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
    shaderSys.render();
  });

  function addText(value: string) {
    if (!value) return;
    setCells.byRefAsync(async (c) => {
      const hasKey = value in tiles;

      if (!tiles[value]) {
        tiles[value] = await renderTextToImage(value, {
          font: "16px mono",
        });
      }

      c[selectedCell().idx] = {
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

  const [cellPos, setCellPos] = ref({ x: 0, y: 0 });
  const [selectedCell, setSelectedCell] = ref({
    col: 0,
    row: 0,
    idx: 0,
    id: "Aa",
  });
  function selectCell(ev: MouseEvent) {
    const cursor = getMousePosition(ev);
    const x = scroll().x % CELL_W;
    const y = scroll().y % CELL_H;
    const { x: offsetX, y: offsetY } = canvasRect();

    setCellPos.byRef((pos) => {
      pos.x = aligned(cursor.x + x - offsetX, CELL_W) - x + offsetX;
      pos.y = aligned(cursor.y + y - offsetY, CELL_H) - y + offsetY;
    });

    setSelectedCell.byRef((c) => {
      c.col = Math.floor((cursor.x + scroll().x - offsetX) / CELL_W);
      c.row = Math.floor((cursor.y + scroll().y - offsetY) / CELL_H);
      c.idx = c.row * MAX_COLS + c.col;
      c.id = `${toAlphaUpper(c.col)}${toAlphaLower(c.row)}`;
    });

    cellInput.focus();
  }

  watch(() => {
    if (prefersDark()) {
      // #18181b
      shaderSys?.gl.clearColor(...COLOR_CELL_DARK, 1.0);
    } else {
      shaderSys?.gl.clearColor(...COLOR_CELL_LIGHT, 1.0);
    }
  });

  const [cellKeys, setCellKeys] = ref({
    cols: [] as string[],
    rows: [] as string[],
  });
  watchOnly([canvasRect, cells, scroll, prefersDark], () => {
    const { width, height } = canvasRect();
    const w = width + 1 * CELL_W;
    const h = height + 1 * CELL_H;

    const cols = Math.ceil(w / CELL_W);
    const rows = Math.ceil(h / CELL_H);

    setCellKeys.byRef((k) => {
      const colOffset = Math.floor(scroll().x / CELL_W);
      k.cols.length = 0;
      for (let i = colOffset; i < cols + colOffset; i++) {
        const idx = k.cols.length;
        k.cols.push("");
        k.cols[idx] += `${toAlphaUpper(i)} `;
      }

      const rowOffset = Math.floor(scroll().y / CELL_H);
      k.rows.length = 0;
      for (let i = rowOffset; i < rows + rowOffset; i++) {
        const idx = k.rows.length;
        k.rows.push("");
        k.rows[idx] += `${toAlphaLower(i)} `;
      }
    });

    const lineColor = prefersDark()
      ? COLOR_GRID_LINE_DARK
      : COLOR_GRID_LINE_LIGHT;
    const cellColor = prefersDark() ? COLOR_CELL_DARK : COLOR_CELL_LIGHT;
    const offsetX = aligned(scroll().x, CELL_W);
    const offsetY = aligned(scroll().y, CELL_H);

    setInstances.byRef((inst) => {
      const numCells = Object.keys(cells()).length;
      inst.resize(rows + cols + numCells + 1);

      for (let i = 0; i < cols; i++) {
        const model = inst.modelAt(i);
        Mat4.scaleIdentity(model, 1, h, 1);
        Mat4.translateTo(model, i * CELL_W + offsetX, offsetY, 0);
        inst.colorAt(i).set(lineColor);
        inst.hasUVAt(i)[0] = 0;
      }

      for (let i = 0; i < rows; i++) {
        const model = inst.modelAt(i + cols);
        Mat4.scaleIdentity(model, w, 1, 1);
        Mat4.translateTo(model, offsetX, i * CELL_H + offsetY, 0);
        inst.colorAt(i + cols).set(lineColor);
        inst.hasUVAt(i + cols)[0] = 0;
      }

      let i = 0;
      for (const k in cells()) {
        const c = cells()[k];
        const uv = atlas.uvCoords[c.text];
        inst.hasUVAt(rows + cols + i)[0] = 1;
        inst.colorAt(rows + cols + i).set(cellColor);
        inst.uvAt(rows + cols + i).set(uv);
        const model = inst.modelAt(rows + cols + i);
        Mat4.scaleIdentity(model, c.width, c.height, 1);
        Mat4.translateTo(model, c.x + offsetX, c.y + offsetY, 100);
        i++;
      }

      if (atlas) {
        const i = numCells;
        inst.hasUVAt(rows + cols + i)[0] = 1;
        inst.colorAt(rows + cols + i).set(cellColor);
        inst.uvAt(rows + cols + i).set([0, 0, 1, 1]);
        const model = inst.modelAt(rows + cols + i);
        Mat4.scaleIdentity(model, atlas.width, atlas.height, 1);
        Mat4.translateTo(model, 0, 0, 100);
      }

      if (shader && shaderSys) {
        shaderSys?.resizeInstances(shader, inst.data);
      }
    });
  });

  watchOnly([prefersDark, projection, instances], () => {
    shaderSys?.requestRedraw();
  });

  watchOnly([canvasRect, scroll], () => {
    updateProjection();
  });

  return (
    <article class="font-mono overflow-hidden max-w-dvw max-h-dvh grid grid-rows-[auto_minmax(0,1fr)] grid-cols-[max-content_minmax(0,1fr)]">
      <div class="relative dark:bg-zinc-800 bg-zinc-200 z-1" />
      <header
        class="relative overflow-visible max-w-dvw whitespace-nowrap"
        style:left={`-${scroll().x % CELL_W}px`}
      >
        <For
          each={cellKeys().cols}
          do={(col) => (
            <button
              type="button"
              class={`${CELL_HEADER_STYLE}`}
              style:width={`${CELL_W}px`}
            >
              {col()}
            </button>
          )}
        />
      </header>
      <aside
        class="relative overflow-visible max-h-dvh"
        style:top={`-${scroll().y % CELL_H}px`}
      >
        <For
          each={cellKeys().rows}
          do={(row) => (
            <button
              type="button"
              class={`block w-full px-2 ${CELL_HEADER_STYLE}`}
              style:height={`${CELL_H}px`}
            >
              {row()}
            </button>
          )}
        />
      </aside>
      <canvas $ref={canvas} g:onkeydown={keyListener} class="w-full h-full" />
      <label
        class="absolute not-has-focus:opacity-0 z-10 h-8 w-25"
        style:left={`${cellPos().x}px`}
        style:top={`${cellPos().y}px`}
      >
        <input
          $ref={cellInput}
          class="px-2 rounded-xs bg-zinc-50 text-zinc-900 outline-indigo-700 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-emerald-400 outline-dashed outline-2 h-full w-full"
          on:change={(e) => addText(e.currentTarget.value)}
        />
        <strong class="absolute -top-7 -left-1 p-1">{selectedCell().id}</strong>
      </label>
      <div
        class="overflow-auto absolute right-0 bottom-0"
        style:width={`${canvasRect().width}px`}
        style:height={`${canvasRect().height}px`}
        on:dblclick={selectCell}
        on:scroll={(ev) =>
          setScroll({
            x: ev.currentTarget.scrollLeft,
            y: ev.currentTarget.scrollTop,
          })
        }
      >
        <div
          style:width={`${CELL_W * MAX_COLS}px`}
          style:height={`${CELL_H * MAX_ROWS}px`}
        />
      </div>
      <Dbg open={dbg()} x={100} y={100} draggable onclose={setDbg}>
        Model: <br />
        {Mat4.toString(instances().modelAt(instIdx))}
        <br /> <br />
        Projection: <br />
        {Mat4.toString(projection())}
        <br /> <br />
        Selected: {JSON.stringify(selectedCell())}
        <br /> <br />
        Cells: {JSON.stringify(cells())}
        <br /> <br />
        Scroll: {scroll().x} {scroll().y}
      </Dbg>
    </article>
  );
}
