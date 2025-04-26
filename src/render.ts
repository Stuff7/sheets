import type { Color, CellMap, Cell } from "./types";
import {
  COLOR_CELL_DARK,
  COLOR_CELL_LIGHT,
  COLOR_GRID_LINE_DARK,
  COLOR_GRID_LINE_LIGHT,
  COLOR_SELECTED_CELL_DARK,
  COLOR_SELECTED_CELL_LIGHT,
  GRID_LINE_SIZE,
  CELL_H,
  CELL_W,
} from "./config";
import { aligned, getCellIdx, totalOffsetsRange } from "./utils";
import {
  canvasRect,
  colOffsets,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  customCells,
  prefersDark,
  rowOffsets,
  scroll,
  selectedQuads,
  selectedRegions,
  setCustomCells,
  setInstances,
} from "./state";
import {
  createTextureAtlas,
  loadTextureAtlas,
  renderTextToImage,
  type Atlas,
  type TileMap,
} from "./texture";
import type { Instances } from "./instance";
import { Mat4 } from "./math";
import { watchOnly } from "jsx";
import { getGL, resizeInstances } from "./Canvas";
import { parseRange, rangesOverlap } from "./gridArea";

let atlas!: Atlas;
const tiles: TileMap = {};

watchOnly(
  [
    canvasRect,
    selectedQuads,
    customCells,
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
    const firstCol = computeFirstVisibleColumn(scroll().x);
    const firstRow = computeFirstVisibleRow(scroll().y);
    let numCustoms = 0;
    let numSelQuads = 0;
    const textCells: CellMap = {};
    const visibleRange = {
      startCol: firstCol.index,
      startRow: firstRow.index,
      endCol: firstCol.index + cols,
      endRow: firstRow.index + rows,
    };

    let i = 0;
    const selRegions: number[] = [];
    for (const r of selectedRegions()) {
      const range = parseRange(r);
      if (rangesOverlap(range, visibleRange)) {
        selRegions.push(...selectedQuads().slice(i, i + 4));
        numSelQuads++;
      }
      i += 4;
    }

    for (let r = firstRow.index; r < firstRow.index + rows; r++) {
      for (let c = firstCol.index; c < firstCol.index + cols; c++) {
        const idx = getCellIdx(c, r);
        if (idx in customCells()) {
          textCells[idx] = customCells()[idx];
          numCustoms++;
        }
      }
    }

    setInstances.byRef((inst) => {
      const numCells = numSelQuads + numCustoms;
      inst.resize(rows + cols + numCells);

      for (let i = 0; i < cols; i++) {
        const colIdx = firstCol.index + i - 1;
        const offset = totalOffsetsRange(firstCol.index, colIdx, colOffsets());
        const model = inst.modelAt(i);
        Mat4.scaleIdentity(model, GRID_LINE_SIZE, h, 1);
        Mat4.translateTo(
          model,
          i * CELL_W + scroll().x + offset - firstCol.remainder,
          offsetY,
          10,
        );
        inst.colorAt(i).set(lineColor);
        inst.hasUVAt(i)[0] = 0;
      }

      for (let i = 0; i < rows; i++) {
        const rowIdx = firstRow.index + i - 1;
        const offset = totalOffsetsRange(firstRow.index, rowIdx, rowOffsets());
        const model = inst.modelAt(i + cols);
        Mat4.scaleIdentity(model, w, GRID_LINE_SIZE, 1);
        Mat4.translateTo(
          model,
          offsetX,
          i * CELL_H + scroll().y + offset - firstRow.remainder,
          10,
        );
        inst.colorAt(i + cols).set(lineColor);
        inst.hasUVAt(i + cols)[0] = 0;
      }

      drawCellMap(inst, textCells, rows + cols, cellColor);
      drawRegions(inst, selRegions, rows + cols + numCustoms, 1);

      resizeInstances(inst.data);
    });
  },
);

export function drawRegions(
  inst: Instances,
  cellMap: number[],
  offset: number,
  z = 0,
) {
  let i = offset;
  for (let n = 0; n < cellMap.length; n += 4) {
    const [x, y, w, h] = cellMap.slice(n, n + 4);
    const color = prefersDark()
      ? COLOR_SELECTED_CELL_DARK
      : COLOR_SELECTED_CELL_LIGHT;
    inst.hasUVAt(i)[0] = 0;
    inst.colorAt(i).set(color);

    const model = inst.modelAt(i);
    Mat4.scaleIdentity(model, w, h, 1);
    Mat4.translateTo(model, x, y, z);
    i++;
  }
}

function drawCellMap(
  inst: Instances,
  cellMap: CellMap,
  offset: number,
  cellColor: Color,
  z = 0,
) {
  let i = offset;
  for (const k in cellMap) {
    const c = cellMap[k];

    if (c.text) {
      const uv = atlas.uvCoords[c.text];
      inst.uvAt(i).set(uv);
      inst.hasUVAt(i)[0] = 1;
      inst.colorAt(i).set(cellColor);
    } else {
      const color = prefersDark()
        ? COLOR_SELECTED_CELL_DARK
        : COLOR_SELECTED_CELL_LIGHT;
      inst.hasUVAt(i)[0] = 0;
      inst.colorAt(i).set(color);
    }

    const model = inst.modelAt(i);
    Mat4.scaleIdentity(model, c.width, c.height, 1);
    Mat4.translateTo(model, c.x, c.y, z);
    i++;
  }
}

export async function addText(pos: Cell, value: string) {
  if (!value) return;
  const hasKey = value in tiles;

  if (!tiles[value]) {
    tiles[value] = await renderTextToImage(value, {
      font: "16px mono",
    });
  }

  if (!hasKey) {
    atlas = createTextureAtlas(tiles);
    loadTextureAtlas(getGL());
  }

  setCustomCells.byRef((cell) => {
    const c = createCell(cell, getCellIdx(pos.col, pos.row));
    c.text = value;
    c.width = tiles[value].width;
    c.height = tiles[value].height;
    c.x = pos.x;
    c.y = pos.y;
  });
}

function createCell(c: CellMap, idx: number) {
  if (!c[idx]) {
    c[idx] = {
      text: "",
      width: CELL_W,
      height: CELL_H,
      x: 0,
      y: 0,
    };
  }
  return c[idx];
}
