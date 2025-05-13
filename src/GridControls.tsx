import { ref, watchFn } from "jsx";
import {
  totalOffsets,
  totalOffsetsRange,
  getCellId,
  getMousePosition,
  isTouchscreen,
} from "./utils";
import {
  canvasRect,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  getEffectiveCellHeight,
  getEffectiveCellWidth,
  scroll,
  setScroll,
  setScrollEl,
  touchSelection,
  ctrlPressed,
  setSelectedColor,
  prefersDark,
  defaultCellColor,
  currentSheet,
} from "./state";
import Dbg from "./Dbg";
import type { Cell, PartialCell } from "./types";
import { CELL_H, CELL_W, MAX_COLS, MAX_ROWS } from "./config";
import { addText, atlasTiles } from "./render";
import {
  parseRegion,
  regionToQuad,
  carveRegion,
  regionsOverlap,
} from "./region";

export default function GridControls() {
  let cellInput!: HTMLTextAreaElement;
  let isSelecting = false;
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

  watchFn(scroll, () => {
    firstCol = computeFirstVisibleColumn(scroll().x);
    firstRow = computeFirstVisibleRow(scroll().y);
  });

  function doSelection(ev: MouseEvent | TouchEvent) {
    if (!isSelecting) return;
    updateSelection(ev);
  }

  let hasDragged = false;
  let lastCell: Cell | null = null;

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

    hasDragged = false;
    updateSelection(ev);
    isSelecting = true;
    updateSelectedColor();
  }

  watchFn(prefersDark, updateSelectedColor);

  function updateSelectedColor() {
    let cellColor: string | undefined;
    const cellRegion = {
      startCol: areaStart.col,
      startRow: areaStart.row,
      endCol: areaStart.col,
      endRow: areaStart.row,
    };
    for (const color in currentSheet().colorRegions()) {
      for (const r of currentSheet().colorRegions()[color]) {
        const region = parseRegion(r);
        if (regionsOverlap(region, cellRegion)) {
          cellColor = color;
          break;
        }
      }
      if (cellColor) break;
    }
    setSelectedColor(cellColor ?? defaultCellColor());
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

    if (!ctrlPressed())
      currentSheet().setLastSelectedRegions.byRef((sel) => sel.clear());
    const sel = new Set(currentSheet().lastSelectedRegions());
    carveRegion(sel, startCol, startRow, endCol, endRow);
    currentSheet().setSelectedRegions(sel);
  }

  function addTextCell(text: string) {
    if (!text) return;
    addText(text, inputCell.col, inputCell.row);
    cellInput.value = "";
  }

  watchFn(
    () => [
      currentSheet().selectedRegions(),
      currentSheet().textCells(),
      currentSheet().colOffsets(),
      currentSheet().rowOffsets(),
    ],
    (c) => {
      if (!(c instanceof Set)) {
        areaStart = {
          ...(c === currentSheet().colOffsets() ? areaLeft : areaTop),
        };
        positionCell(areaStart);
      }

      currentSheet().setSelectedQuads.byRef((quads) => {
        quads.length = 0;
        for (const r of currentSheet().selectedRegions()) {
          quads.push(...regionToQuad(parseRegion(r)));
        }
      });

      currentSheet().setTextQuads.byRef((quads) => {
        quads.length = 0;
        for (const cellIdx in currentSheet().textCells()) {
          const idx = +cellIdx;
          const col = idx % MAX_COLS;
          const row = Math.floor(idx / MAX_COLS);
          quads.push(
            ...regionToQuad({
              startCol: col,
              startRow: row,
              endCol: col,
              endRow: row,
            }),
          );
          quads[quads.length - 2] =
            atlasTiles[currentSheet().textCells()[cellIdx]].width;
          quads[quads.length - 1] =
            atlasTiles[currentSheet().textCells()[cellIdx]].height;
        }
      });
    },
  );

  watchFn(
    () => currentSheet().lastSelectedRegions(),
    () =>
      currentSheet().setSelectedRegions(
        new Set(currentSheet().lastSelectedRegions()),
      ),
  );

  function endSelection() {
    if (!isSelecting) return;
    if (isTouchscreen && !touchSelection()) return;
    isSelecting = false;
    currentSheet().setLastSelectedRegions(
      new Set(currentSheet().selectedRegions()),
    );
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
      totalOffsetsRange(
        firstCol.index,
        c.col - 1,
        currentSheet().colOffsets(),
      ) -
      firstCol.remainder;
    c.y =
      (c.row - firstRow.index) * CELL_H +
      scroll().y +
      totalOffsetsRange(
        firstRow.index,
        c.row - 1,
        currentSheet().rowOffsets(),
      ) -
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
        class="absolute right-0"
        class:overflow-auto={!touchSelection()}
        style:top={`${canvasRect().y}px`}
        style:width={`${canvasRect().width}px`}
        style:height={`${canvasRect().height}px`}
        on:scroll={(ev) =>
          setScroll({
            x: ev.currentTarget.scrollLeft,
            y: ev.currentTarget.scrollTop,
          })
        }
      >
        <div
          style:width={`${CELL_W * MAX_COLS + totalOffsets(currentSheet().colOffsets())}px`}
          style:height={`${CELL_H * MAX_ROWS + totalOffsets(currentSheet().rowOffsets())}px`}
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
          class="h-full w-full"
          on:change={(e) => addTextCell(e.currentTarget.value)}
        />
        <strong class="absolute -top-7 -left-1 p-1">
          {inputCellElem().id}
        </strong>
      </label>
      <Dbg>
        <p>
          Colored:{" "}
          {JSON.stringify(
            currentSheet().colorRegions(),
            (_, value) => (value instanceof Set ? Array.from(value) : value),
            2,
          )}
        </p>
        <p>
          Selected:{" "}
          {JSON.stringify([...currentSheet().selectedRegions()], null, 2)}
        </p>
        <p>Texts: {JSON.stringify(currentSheet().textCells(), null, 2)}</p>
        <p>ColOffsets: {JSON.stringify(currentSheet().colOffsets())}</p>
        <p>RowOffsets: {JSON.stringify(currentSheet().rowOffsets())}</p>
      </Dbg>
    </>
  );
}
