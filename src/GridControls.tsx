import { ref, watchFn, watchOnly } from "jsx";
import {
  totalOffsets,
  totalOffsetsRange,
  getCellId,
  getMousePosition,
  isTouchscreen,
  getCellIdx,
} from "./utils";
import {
  canvasRect,
  colOffsets,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  getEffectiveCellHeight,
  getEffectiveCellWidth,
  rowOffsets,
  scroll,
  setCustomCells,
  setScroll,
  setScrollEl,
  setSelectedCells,
  touchSelection,
} from "./state";
import Dbg from "./Dbg";
import type { Cell, CellMap, PartialCell } from "./types";
import { CELL_H, CELL_W, MAX_COLS, MAX_ROWS } from "./config";
import { addText } from "./render";

export default function GridControls() {
  let cellInput!: HTMLTextAreaElement;
  let isSelecting = false;
  let ctrlPressed = isTouchscreen;
  let firstCol: PartialCell;
  let firstRow: PartialCell;

  let areaLeft = {} as Cell;
  let areaTop = {} as Cell;
  let areaStart = {} as Cell;
  const [isCellInputVisible, setIsCellInputVisible] = ref(false);
  const [inputCellElem, setInputCellElem] = ref({
    x: 0,
    y: 0,
    width: CELL_W,
    height: CELL_H,
    id: "Aa",
  });

  watchFn(
    () => scroll(),
    () => {
      firstCol = computeFirstVisibleColumn(scroll().x);
      firstRow = computeFirstVisibleRow(scroll().y);
    },
  );

  queueMicrotask(() => {
    setSelectedCells({
      0: {
        x: 0,
        y: 0,
        width: CELL_W,
        height: CELL_H,
        text: "",
      },
    });
  });

  function doSelection(ev: MouseEvent | TouchEvent) {
    if (!isSelecting) return;
    updateSelection(ev);
  }

  let hasDragged = false;
  let selectedCells: CellMap = {};
  let newSelected: CellMap = {};
  let lastCell: Cell | null = null;
  let initialSelectedCells: CellMap = {};

  function startSelection(ev: MouseEvent | TouchEvent) {
    if (isTouchscreen && !touchSelection()) return;
    ev.preventDefault();
    getCellAtCursor(ev, areaStart);

    if (areaLeft.col == null || areaStart.col < areaLeft.col) {
      areaLeft = { ...areaStart };
    }

    if (areaTop.row == null || areaStart.row < areaTop.row) {
      areaTop = { ...areaStart };
    }

    initialSelectedCells = { ...selectedCells };
    hasDragged = false;
    updateSelection(ev);
    isSelecting = true;
  }

  function updateSelection(ev: MouseEvent | TouchEvent) {
    const areaEnd = getCellAtCursor(ev);

    if (
      lastCell &&
      lastCell.col === areaEnd.col &&
      lastCell.row === areaEnd.row
    ) {
      return;
    }
    lastCell = { ...areaEnd };

    if (areaEnd.col !== areaStart.col || areaEnd.row !== areaStart.row) {
      hasDragged = true;
    }

    const startCol = Math.min(areaStart.col, areaEnd.col);
    const endCol = Math.max(areaStart.col, areaEnd.col);
    const startRow = Math.min(areaStart.row, areaEnd.row);
    const endRow = Math.max(areaStart.row, areaEnd.row);

    if (!ctrlPressed) {
      selectedCells = {};
      initialSelectedCells = {};
    }
    newSelected = { ...initialSelectedCells };

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellIdx = row * MAX_COLS + col;

        if (selectedCells[cellIdx] || newSelected[cellIdx]) {
          delete selectedCells[cellIdx];
          delete newSelected[cellIdx];
          continue;
        }
        positionSelection(cellIdx, col, row);
      }
    }

    setSelectedCells({
      ...selectedCells,
      ...newSelected,
    });
  }

  const customCellPositions: Record<number, Cell> = {};
  function addCustomCell(text: string) {
    if (!text) return;
    addText(inputCell, text);
    customCellPositions[getCellIdx(inputCell.col, inputCell.row)] = inputCell;
  }

  watchOnly([colOffsets, rowOffsets], (c) => {
    areaStart = { ...(c === colOffsets() ? areaLeft : areaTop) };
    positionCell(areaStart);
    selectedCells = {
      ...selectedCells,
      ...newSelected,
    };
    for (const key in selectedCells) {
      const idx = +key;
      const col = idx % MAX_COLS;
      const row = Math.floor(idx / MAX_COLS);
      positionSelection(idx, col, row);
    }
    setSelectedCells(selectedCells);

    setCustomCells.byRef((cells) => {
      for (const k in customCellPositions) {
        const pos = customCellPositions[k];
        pos.x = pos.x + canvasRect().x - scroll().x;
        pos.y = pos.y + canvasRect().y - scroll().y;
        positionCell(pos);
        const cell = cells[k];
        cell.x = pos.x;
        cell.y = pos.y;
      }
    });
  });

  function positionSelection(cellIdx: number, col: number, row: number) {
    const offsetX =
      areaStart.col > col
        ? -totalOffsetsRange(col, areaStart.col - 1, colOffsets())
        : totalOffsetsRange(areaStart.col, col - 1, colOffsets());

    const offsetY =
      areaStart.row > row
        ? -totalOffsetsRange(row, areaStart.row - 1, rowOffsets())
        : totalOffsetsRange(areaStart.row, row - 1, rowOffsets());

    newSelected[cellIdx] = {
      text: "",
      width: getEffectiveCellWidth(col),
      height: getEffectiveCellHeight(row),
      x: areaStart.x + (col - areaStart.col) * CELL_W + offsetX,
      y: areaStart.y + (row - areaStart.row) * CELL_H + offsetY,
    };
  }

  function endSelection() {
    if (!isSelecting) return;
    if (isTouchscreen && !touchSelection()) return;
    isSelecting = false;
    selectedCells = {
      ...selectedCells,
      ...newSelected,
    };
    setSelectedCells(selectedCells);
    lastCell = null;
  }

  function getCellAtCursor(ev: MouseEvent | TouchEvent, c = {} as Cell) {
    const cursor = getMousePosition(ev);

    c.col = computeFirstVisibleColumn(
      scroll().x + cursor.x - canvasRect().x,
    ).index;
    c.row = computeFirstVisibleRow(
      scroll().y + cursor.y - canvasRect().y,
    ).index;

    positionCell(c);

    return c;
  }

  function positionCell(c: Cell) {
    c.x =
      (c.col - firstCol.index) * CELL_W +
      scroll().x +
      totalOffsetsRange(firstCol.index, c.col - 1, colOffsets()) -
      firstCol.remainder;
    c.y =
      (c.row - firstRow.index) * CELL_H +
      scroll().y +
      totalOffsetsRange(firstRow.index, c.row - 1, rowOffsets()) -
      firstRow.remainder;
  }

  const inputCell = {} as Cell;
  function showCellInput(ev: MouseEvent) {
    setIsCellInputVisible(true);
    const { x: offsetX, y: offsetY } = canvasRect();

    setInputCellElem.byRef((pos) => {
      getCellAtCursor(ev, inputCell);
      pos.id = getCellId(inputCell.col, inputCell.row);
      pos.x = inputCell.x + offsetX - scroll().x;
      pos.y = inputCell.y + offsetY - scroll().y;
      pos.width = getEffectiveCellWidth(inputCell.col);
      pos.height = getEffectiveCellHeight(inputCell.row);
      cellInput.focus();
    });
  }

  return (
    <>
      <div
        $refFn={setScrollEl}
        class="absolute right-0 bottom-0"
        class:overflow-auto={!touchSelection()}
        style:width={`${canvasRect().width}px`}
        style:height={`${canvasRect().height}px`}
        g:onkeydown={
          isTouchscreen
            ? undefined
            : (e) => {
                if (e.key === "Control") ctrlPressed = true;
              }
        }
        g:onkeyup={
          isTouchscreen
            ? undefined
            : (e) => {
                if (e.key === "Control") ctrlPressed = false;
              }
        }
        on:scroll={(ev) =>
          setScroll({
            x: ev.currentTarget.scrollLeft,
            y: ev.currentTarget.scrollTop,
          })
        }
      >
        <div
          style:width={`${CELL_W * MAX_COLS + totalOffsets(colOffsets())}px`}
          style:height={`${CELL_H * MAX_ROWS + totalOffsets(rowOffsets())}px`}
          on:click={() => setIsCellInputVisible(false)}
          on:mousedown={startSelection}
          on:mousemove={doSelection}
          on:mouseup={endSelection}
          on:touchstart={startSelection}
          on:touchmove={doSelection}
          on:touchend={endSelection}
          on:dblclick={showCellInput}
        />
      </div>
      <label
        class="absolute z-10 h-8 w-25"
        class:hidden={!isCellInputVisible()}
        style:left={`${inputCellElem().x}px`}
        style:top={`${inputCellElem().y}px`}
        style:width={`${inputCellElem().width}px`}
        style:height={`${inputCellElem().height}px`}
      >
        <textarea
          $ref={cellInput}
          class="px-2 rounded-xs bg-zinc-50 text-zinc-900 outline-indigo-700 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-emerald-400 outline-dashed outline-2 h-full w-full"
          on:change={(e) => addCustomCell(e.currentTarget.value)}
        />
        <strong class="absolute -top-7 -left-1 p-1">
          {inputCellElem().id}
        </strong>
      </label>
      <Dbg>
        <p>Input: {isCellInputVisible()}</p>
      </Dbg>
    </>
  );
}
