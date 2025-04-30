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
  selectedRegions,
  setScroll,
  setScrollEl,
  setSelectedRegions,
  setSelectedQuads,
  touchSelection,
  ctrlPressed,
  setLastSelectedRegions,
  lastSelectedRegions,
  colorRegions,
  setSelectedColor,
  prefersDark,
  defaultCellColor,
  textCells,
} from "./state";
import Dbg from "./Dbg";
import type { Cell, PartialCell } from "./types";
import { CELL_H, CELL_W, MAX_COLS, MAX_ROWS } from "./config";
import { addText } from "./render";
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

  watchFn(
    () => scroll(),
    () => {
      firstCol = computeFirstVisibleColumn(scroll().x);
      firstRow = computeFirstVisibleRow(scroll().y);
    },
  );

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
    for (const color in colorRegions()) {
      for (const r of colorRegions()[color]) {
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

    if (!ctrlPressed()) setLastSelectedRegions.byRef((sel) => sel.clear());
    const sel = new Set(lastSelectedRegions());
    carveRegion(sel, startCol, startRow, endCol, endRow);
    setSelectedRegions(sel);
  }

  const customCellPositions: Record<number, Cell> = {};
  function addTextCell(text: string) {
    if (!text) return;
    addText(inputCell, text);
    customCellPositions[getCellIdx(inputCell.col, inputCell.row)] = inputCell;
  }

  watchOnly([selectedRegions, colOffsets, rowOffsets], (c) => {
    if (!(c instanceof Set)) {
      areaStart = { ...(c === colOffsets() ? areaLeft : areaTop) };
      positionCell(areaStart);
    }

    setSelectedQuads.byRef((quads) => {
      quads.length = 0;
      for (const r of selectedRegions()) {
        quads.push(...regionToQuad(parseRegion(r)));
      }
    });
  });

  watchOnly([lastSelectedRegions], () =>
    setSelectedRegions(new Set(lastSelectedRegions())),
  );

  function endSelection() {
    if (!isSelecting) return;
    if (isTouchscreen && !touchSelection()) return;
    isSelecting = false;
    setLastSelectedRegions(new Set(selectedRegions()));
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
            colorRegions(),
            (_, value) => (value instanceof Set ? Array.from(value) : value),
            2,
          )}
        </p>
        <p>Selected: {JSON.stringify([...selectedRegions()], null, 2)}</p>
        <p>Texts: {JSON.stringify(textCells(), null, 2)}</p>
        <p>ColOffsets: {JSON.stringify(colOffsets())}</p>
        <p>RowOffsets: {JSON.stringify(rowOffsets())}</p>
      </Dbg>
    </>
  );
}
