

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
} from "./config";
import { aligned, totalOffsetsRange, hexToRgba } from "./utils";
import {
  canvasRect,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  prefersDark,
  scroll,
  setInstances,
  currentSheet,
} from "./state";
import type { Instances } from "./instance";
import { Mat4 } from "./math";
import { watchFn } from "jsx";
import { resizeInstances } from "./Canvas";
import { parseRegion, regionsOverlap } from "./region";

watchFn(
  () => [
    canvasRect(),
    currentSheet().colorQuads(),
    currentSheet().colOffsets(),
    currentSheet().rowOffsets(),
    scroll(),
    prefersDark(),
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

    const colors: Record<string, number[]> = {};
    const numColors: number[] = [];
    for (const color in currentSheet().colorQuads()) {
      const quads = currentSheet().colorQuads()[color];
      const [regions, numRegions] = filterVisibleRegions(
        currentSheet().colorRegions()[color],
        quads,
      );
      if (numRegions === 0) continue;
      colors[color] = regions;
      numColors.push(numRegions);
    }

    setInstances.byRef((inst) => {
      const numCells = numColors.reduce((t, n) => t + n, 0);
      inst.resize(rows + cols + numCells);

      let instOffset = 0;
      for (let i = 0; i < cols; i++) {
        const colIdx = firstCol.index + i - 1;
        const offset = totalOffsetsRange(
          firstCol.index,
          colIdx,
          currentSheet().colOffsets(),
        );
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
        const offset = totalOffsetsRange(
          firstRow.index,
          rowIdx,
          currentSheet().rowOffsets(),
        );
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
        drawRegions(inst, quads, instOffset, hexToRgba(color), n / 10);
        instOffset += numColors[n++];
      }

      resizeInstances(inst.data);
    });
  },
);

export function drawRegions(
  inst: Instances,
  cellMap: number[],
  offset: number,
  cellColor?: Color,
  z = 0,
) {
  let i = offset;
  for (let n = 0; n < cellMap.length; n += 4) {
    const [x, y, w, h] = cellMap.slice(n, n + 4);
    const color =
      cellColor ??
      (prefersDark() ? COLOR_SELECTED_CELL_DARK : COLOR_SELECTED_CELL_LIGHT);
    inst.hasUVAt(i)[0] = 0;
    inst.colorAt(i).set(color);

    const model = inst.modelAt(i);
    Mat4.scaleIdentity(model, w, h, 1);
    Mat4.translateTo(model, x, y, z);
    i++;
  }
}
