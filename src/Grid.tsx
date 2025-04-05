import { ref, watch, watchOnly } from "jsx";
import Dbg from "./Dbg";
import {
  canvasRect,
  setCanvasRect,
  prefersDark,
  colOffsets,
  rowOffsets,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
} from "./state";
import { initShaderSystem, type ShaderSystem, type Shader } from "./gl";
import {
  CELL_W,
  CELL_H,
  aligned,
  getCellIdx,
  totalOffsetsRange,
  type CellMap,
  type Color,
} from "./utils";
import { Mat4 } from "./math";
import { initInstances, QUAD_MESH } from "./instance";
import GridControls from "./GridControls";
import { useCells } from "./useCells";
import GridAxes from "./GridAxes";

const GRID_LINE_SIZE = 1;

const COLOR_GRID_LINE_DARK: Color = [0.25, 0.25, 0.27, 1.0]; // zinc-700 #3f3f46
const COLOR_GRID_LINE_LIGHT: Color = [0.89, 0.89, 0.91, 1.0]; // zinc-200 #e4e4e7
const COLOR_CELL_DARK: Color = [0.09, 0.09, 0.11, 1.0]; // zinc-900 #18181b
const COLOR_CELL_LIGHT: Color = [0.98, 0.98, 0.98, 1.0]; // zinc-50 #fafafa

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

  watchOnly(
    [
      canvasRect,
      cells.selected,
      cells.list,
      colOffsets,
      rowOffsets,
      scroll,
      prefersDark,
    ],
    () => {
      const { width, height } = canvasRect();
      const w = width + CELL_W;
      const h = height + CELL_H;

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);

      let lineColor = COLOR_GRID_LINE_DARK;
      let cellColor = COLOR_CELL_DARK;
      if (!prefersDark()) {
        lineColor = COLOR_GRID_LINE_LIGHT;
        cellColor = COLOR_CELL_LIGHT;
      }

      const offsetX = aligned(scroll().x, CELL_W);
      const offsetY = aligned(scroll().y, CELL_H);

      // Only render instances in view
      const col = Math.floor(scroll().x / CELL_W);
      const row = Math.floor(scroll().y / CELL_H);
      let numSelected = 0;
      let numTexts = 0;
      const selectedCells: CellMap = {};
      const textCells: CellMap = {};
      for (let r = row; r < row + rows; r++) {
        for (let c = col; c < col + cols; c++) {
          const idx = getCellIdx(c, r);
          if (idx in cells.selected()) {
            selectedCells[idx] = cells.selected()[idx];
            numSelected++;
          }
          if (idx in cells.list()) {
            textCells[idx] = cells.list()[idx];
            numTexts++;
          }
        }
      }

      setInstances.byRef((inst) => {
        const numCells = numSelected + numTexts;
        inst.resize(rows + cols + numCells);

        const col = computeFirstVisibleColumn(scroll().x);
        for (let i = 0; i < cols; i++) {
          const colIdx = col.index + i - 1;
          const offset = totalOffsetsRange(col.index, colIdx, colOffsets());
          const model = inst.modelAt(i);
          Mat4.scaleIdentity(model, GRID_LINE_SIZE, h, 1);
          Mat4.translateTo(
            model,
            i * CELL_W + scroll().x + offset - col.remainder,
            offsetY,
            0,
          );
          inst.colorAt(i).set(lineColor);
          inst.hasUVAt(i)[0] = 0;
        }

        const row = computeFirstVisibleRow(scroll().y);
        for (let i = 0; i < rows; i++) {
          const rowIdx = row.index + i - 1;
          const offset = totalOffsetsRange(row.index, rowIdx, rowOffsets());
          const model = inst.modelAt(i + cols);
          Mat4.scaleIdentity(model, w, GRID_LINE_SIZE, 1);
          Mat4.translateTo(
            model,
            offsetX,
            i * CELL_H + scroll().y + offset - row.remainder,
            0,
          );
          inst.colorAt(i + cols).set(lineColor);
          inst.hasUVAt(i + cols)[0] = 0;
        }

        cells.draw(inst, textCells, rows + cols, cellColor);
        cells.draw(inst, selectedCells, rows + cols + numTexts, cellColor, 1);

        if (shader && shaderSys) {
          shaderSys?.resizeInstances(shader, inst.data);
        }
      });
    },
  );

  watchOnly([prefersDark, projection, instances], () => {
    shaderSys?.requestRedraw();
  });

  watchOnly([canvasRect, scroll], () => updateProjection());

  return (
    <article class="font-mono overflow-hidden max-w-dvw max-h-dvh grid grid-rows-[auto_minmax(0,1fr)] grid-cols-[max-content_minmax(0,1fr)]">
      <div class="relative dark:bg-zinc-800 bg-zinc-200 z-1" />
      <GridAxes scroll={scroll()} />
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
