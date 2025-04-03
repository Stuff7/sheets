import { ref, watch, watchOnly } from "jsx";
import For from "jsx/components/For";
import Dbg from "./Dbg";
import { canvasRect, setCanvasRect, prefersDark } from "./state";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import { aligned, type Color } from "./utils";
import { Mat4 } from "./math";
import { initInstances, QUAD_MESH } from "./instance";
import GridControls, {
  CELL_W,
  CELL_H,
  toAlphaLower,
  toAlphaUpper,
} from "./GridControls";
import { useCells } from "./useCells";

const COLOR_GRID_LINE_DARK: Color = [0.25, 0.25, 0.27, 1.0]; // zinc-700 #3f3f46
const COLOR_GRID_LINE_LIGHT: Color = [0.89, 0.89, 0.91, 1.0]; // zinc-200 #e4e4e7
const COLOR_CELL_DARK: Color = [0.09, 0.09, 0.11, 1.0]; // zinc-900 #18181b
const COLOR_CELL_LIGHT: Color = [0.98, 0.98, 0.98, 1.0]; // zinc-50 #fafafa

const CELL_HEADER_DARK =
  "dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-emerald-400 dark:active:bg-emerald-100 dark:hover:text-zinc-800";
const CELL_HEADER_LIGHT =
  "border-zinc-300 bg-zinc-200 hover:bg-indigo-700 active:bg-indigo-900 hover:text-zinc-200";
const CELL_HEADER_STYLE = `border min-w-[56.5px] ${CELL_HEADER_DARK} ${CELL_HEADER_LIGHT}`;

export default function Grid() {
  let canvas!: HTMLCanvasElement;
  let shaderSys!: ShaderSystem;
  let shader!: Shader;

  const cells = useCells(() => shaderSys.gl);
  const [scroll, setScroll] = ref({ x: 0, y: 0 });
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

  watch(() => {
    if (prefersDark()) {
      shaderSys?.gl.clearColor(0, 0, 0, 0);
    } else {
      shaderSys?.gl.clearColor(0, 0, 0, 0);
    }
  });

  const [cellKeys, setCellKeys] = ref({
    cols: [] as string[],
    rows: [] as string[],
  });
  watchOnly([canvasRect, cells.selected, scroll, prefersDark], () => {
    const { width, height } = canvasRect();
    const w = width + CELL_W;
    const h = height + CELL_H;

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

    let lineColor = COLOR_GRID_LINE_DARK;
    let cellColor = COLOR_CELL_DARK;
    if (!prefersDark()) {
      lineColor = COLOR_GRID_LINE_LIGHT;
      cellColor = COLOR_CELL_LIGHT;
    }

    const offsetX = aligned(scroll().x, CELL_W);
    const offsetY = aligned(scroll().y, CELL_H);

    setInstances.byRef((inst) => {
      const numSelected = Object.keys(cells.selected()).length;
      const numTexts = Object.keys(cells.list()).length;
      const numCells = numSelected + numTexts;
      inst.resize(rows + cols + numCells);

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

      cells.draw(inst, cells.list(), rows + cols, cellColor);
      cells.draw(inst, cells.selected(), rows + cols + numTexts, cellColor, 1);

      if (shader && shaderSys) {
        shaderSys?.resizeInstances(shader, inst.data);
      }
    });
  });

  watchOnly([prefersDark, projection, instances], () => {
    shaderSys?.requestRedraw();
  });

  watchOnly([canvasRect, scroll], () => updateProjection());

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
      <GridControls
        onCellInput={cells.addText}
        onCellSelection={cells.select}
        scroll={scroll()}
        onScroll={setScroll}
      />
      <canvas $ref={canvas} class="w-full h-full" />
      <Dbg>
        <p>
          Projection: <br />
          {Mat4.toString(projection())}
        </p>
        <p>SelectedCells: {JSON.stringify(cells.selected())}</p>
        <p>Cells: {JSON.stringify(cells.list())}</p>
        <p>
          Scroll: {scroll().x} {scroll().y}
        </p>
      </Dbg>
    </article>
  );
}
