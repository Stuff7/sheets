import type { Color } from "./types";
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
  MAX_COLS,
} from "./config";
import { aligned, getCellIdx, totalOffsetsRange, hexToRgba } from "./utils";
import {
  canvasRect,
  colOffsets,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  textCells,
  prefersDark,
  rowOffsets,
  scroll,
  selectedQuads,
  selectedRegions,
  setTextCells,
  setInstances,
  colorQuads,
  colorRegions,
  textQuads,
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
import { parseRegion, regionsOverlap } from "./region";

let atlas!: Atlas;
export const atlasTiles: TileMap = {};

watchOnly(
  [
    canvasRect,
    selectedQuads,
    colorQuads,
    textCells,
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
    const visibleRange = {
      startCol: firstCol.index,
      startRow: firstRow.index,
      endCol: firstCol.index + cols,
      endRow: firstRow.index + rows,
    };

    const filterVisibleRegions = (
      regions: Set<string>,
      quads: number[],
    ): [number[], number] => {
      let i = 0;
      let numQuads = 0;
      const visibleRegions: number[] = [];
      for (const r of regions) {
        const range = parseRegion(r);
        if (regionsOverlap(range, visibleRange)) {
          visibleRegions.push(...quads.slice(i, i + 4));
          numQuads++;
        }
        i += 4;
      }
      return [visibleRegions, numQuads];
    };

    const [selRegions, numSelQuads] = filterVisibleRegions(
      selectedRegions(),
      selectedQuads(),
    );
    const colors: Record<string, number[]> = {};
    const numColors: number[] = [];
    for (const color in colorQuads()) {
      const quads = colorQuads()[color];
      const [regions, numRegions] = filterVisibleRegions(
        colorRegions()[color],
        quads,
      );
      if (numRegions === 0) continue;
      colors[color] = regions;
      numColors.push(numRegions);
    }

    let i = 0;
    const visTextQuads: number[] = [];
    const visTexts: string[] = [];
    for (const cellIdx in textCells()) {
      const idx = +cellIdx;
      const row = Math.floor(idx / MAX_COLS);
      const col = idx % MAX_COLS;
      if (
        regionsOverlap(
          { startCol: col, startRow: row, endCol: col, endRow: row },
          visibleRange,
        )
      ) {
        visTextQuads.push(...textQuads().slice(i, i + 4));
        visTexts.push(textCells()[idx]);
      }
      i += 4;
    }

    setInstances.byRef((inst) => {
      const numCells =
        numSelQuads +
        visTextQuads.length +
        numColors.reduce((t, n) => t + n, 0);
      inst.resize(rows + cols + numCells);

      let instOffset = 0;
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
      instOffset += cols;

      for (let i = 0; i < rows; i++) {
        const rowIdx = firstRow.index + i - 1;
        const offset = totalOffsetsRange(firstRow.index, rowIdx, rowOffsets());
        const model = inst.modelAt(i + instOffset);
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
      instOffset += rows;

      let n = 0;
      for (const color in colors) {
        const quads = colors[color];
        drawRegions(
          inst,
          quads,
          instOffset,
          undefined,
          hexToRgba(color),
          n / 10,
        );
        instOffset += numColors[n++];
      }

      drawRegions(inst, visTextQuads, instOffset, visTexts, undefined, 4);
      instOffset += visTextQuads.length;

      drawRegions(inst, selRegions, instOffset, undefined, undefined, 5);

      resizeInstances(inst.data);
    });
  },
);

export function drawRegions(
  inst: Instances,
  cellMap: number[],
  offset: number,
  texts?: string[],
  cellColor?: Color,
  z = 0,
) {
  let i = offset;
  for (let n = 0; n < cellMap.length; n += 4) {
    const [x, y, w, h] = cellMap.slice(n, n + 4);
    if (texts != null) {
      inst.hasUVAt(i)[0] = 1;
      inst.uvAt(i).set(atlas.uvCoords[texts[n / 4]]);
    } else {
      const color =
        cellColor ??
        (prefersDark() ? COLOR_SELECTED_CELL_DARK : COLOR_SELECTED_CELL_LIGHT);
      inst.hasUVAt(i)[0] = 0;
      inst.colorAt(i).set(color);
    }

    const model = inst.modelAt(i);
    Mat4.scaleIdentity(model, w, h, 1);
    Mat4.translateTo(model, x, y, z);
    i++;
  }
}

export async function addText(value: string, col: number, row: number) {
  if (!value) return;
  const hasKey = value in atlasTiles;

  if (!atlasTiles[value]) {
    atlasTiles[value] = await renderTextToImage(value, {
      font: "16px mono",
    });
  }

  if (!hasKey) {
    atlas = createTextureAtlas(atlasTiles);
    loadTextureAtlas(getGL());
  }

  setTextCells.byRef((cells) => {
    console.log(cells, col, row, value);
    cells[getCellIdx(col, row)] = value;
  });
}
