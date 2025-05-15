import { watchFn } from "jsx";
import {
  totalOffsets,
  totalOffsetsRange,
  getMousePosition,
  isTouchscreen,
  getCellId,
} from "./utils";
import {
  canvasRect,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  scroll,
  setScroll,
  setScrollEl,
  touchSelection,
  ctrlPressed,
  setSelectedColor,
  prefersDark,
  defaultCellColor,
  currentSheet,
  cellInputEl,
  isCellInputVisible,
  cellText,
  positionCellInput,
  cellInputInfo,
  setCellText,
} from "./state";
import Dbg from "./Dbg";
import type { Cell, PartialCell } from "./types";
import { CELL_H, CELL_W, MAX_COLS, MAX_ROWS } from "./config";
import {
  parseRegion,
  regionToQuad,
  carveRegion,
  regionsOverlap,
} from "./region";
import For from "jsx/components/For";
import { selectedFont } from "./FontSelector";

export default function GridControls() {
  let isSelecting = false;
  let firstCol: PartialCell;
  let firstRow: PartialCell;

  let areaLeft = {} as Cell;
  let areaTop = {} as Cell;
  let areaStart = {} as Cell;

  let cellInputStart = 0;
  let cellInputEnd = 0;
  let cellInputText = "";

  watchFn(scroll, () => {
    firstCol = computeFirstVisibleColumn(scroll().x);
    firstRow = computeFirstVisibleRow(scroll().y);
  });

  function doSelection(ev: MouseEvent | TouchEvent) {
    if (!isSelecting) return;
    updateSelection(ev);
  }

  let hasDragged = false;

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

    cellInputStart = cellInputEl().selectionStart;
    cellInputEnd = cellInputEl().selectionEnd;
    cellInputText = cellInputEl().value;

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

    if (cellText()[0] !== "=") {
      cellInputEl().blur();
    } else if (document.activeElement === cellInputEl()) {
      const selection = currentSheet().selectedRegions().values().next()?.value;
      if (!selection) return;

      const region = parseRegion(selection);
      let text = getCellId(region.startCol, region.startRow);
      if (
        region.startCol !== region.endCol ||
        region.startRow !== region.endRow
      ) {
        text = `${text}:${getCellId(region.endCol, region.endRow)}`;
      }

      setCellText(
        cellInputText.slice(0, cellInputStart) +
          text +
          cellInputText.slice(cellInputEnd),
      );

      cellInputEl().selectionStart = cellInputEl().selectionEnd =
        cellInputStart + text.length;
    }
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
          const quad = regionToQuad({
            startCol: col,
            startRow: row,
            endCol: col,
            endRow: row,
          });
          quads.push({
            cell: currentSheet().textCells()[cellIdx],
            x: quad[0],
            y: quad[1],
            w: quad[2],
            h: quad[3],
          });
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

  function showCellInput() {
    positionCellInput();
    cellInputEl().focus();
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
          tabindex={0}
          style:width={`${CELL_W * MAX_COLS + totalOffsets(currentSheet().colOffsets())}px`}
          style:height={`${CELL_H * MAX_ROWS + totalOffsets(currentSheet().rowOffsets())}px`}
          on:mousedown={startSelection}
          on:mousemove={doSelection}
          on:mouseup={endSelection}
          on:touchstart={startSelection}
          on:touchmove={doSelection}
          on:touchend={endSelection}
          on:dblclick={showCellInput}
        >
          <For
            each={currentSheet().textQuads()}
            do={(t) => (
              <div
                class="absolute text-wrap break-all py-1 px-2"
                style:font-family={t().cell.style.family}
                style:font-size={`${t().cell.style.size}px`}
                style:font-weight={t().cell.style.bold ? "bold" : "normal"}
                style:font-style={t().cell.style.italic ? "italic" : "normal"}
                style:text-decoration-line={
                  t().cell.computed instanceof Error
                    ? ""
                    : `${t().cell.style.underline ? "underline " : ""}${t().cell.style.strikethrough ? "line-through" : ""}`
                }
                style:color={t().cell.style.color}
                style:left={`${t().x}px`}
                style:top={`${t().y}px`}
                style:width={`${t().w}px`}
                style:height={`${t().h}px`}
              >
                <strong
                  $if={t().cell.computed instanceof Error}
                  class="font-mono text-base font-bold not-italic text-red-500"
                  $title={t().cell.computed.toString()}
                >
                  #ERROR!
                </strong>
                <span $if={typeof t().cell.computed === "string"}>
                  {t().cell.computed}
                </span>
              </div>
            )}
          />
        </div>
        <pre
          class="absolute z-10 h-8 w-25 p-1 outline outline-indigo-500 dark:outline-emerald-500 whitespace-pre-wrap pointer-events-none"
          class:hidden={!isCellInputVisible()}
          style:background-color={defaultCellColor()}
          style:left={`${cellInputInfo().x}px`}
          style:top={`${cellInputInfo().y}px`}
          style:width={`${cellInputInfo().width}px`}
          style:height={`${cellInputInfo().height}px`}
          style:font-family={selectedFont().family}
          style:font-size={`${selectedFont().size}px`}
          style:font-weight={selectedFont().bold ? "bold" : "normal"}
          style:font-style={selectedFont().italic ? "italic" : "normal"}
          style:text-decoration-line={`${selectedFont().underline ? "underline " : ""}${selectedFont().strikethrough ? "line-through" : ""}`}
          style:color={selectedFont().color}
        >
          {cellText()}
          <strong class="absolute -top-6 -left-1 p-1 font-mono">
            {cellInputInfo().id}
          </strong>
        </pre>
      </div>
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
        <p>inputCellInfo: {JSON.stringify(cellInputInfo(), null, 2)}</p>
      </Dbg>
    </>
  );
}
