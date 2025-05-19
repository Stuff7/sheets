import { watchFn } from "jsx";
import {
  totalOffsets,
  totalOffsetsRange,
  getMousePosition,
  isTouchscreen,
  getCellId,
  getCellIdx,
} from "./utils";
import {
  canvasRect,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  scroll,
  setScroll,
  setScrollEl,
  touchSelecting,
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
  getSelectedRegion,
  lastFormulaRegion,
  setTouchSelecting,
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
import { formatMap, selectedFont } from "./FontSelector";

export default function GridControls() {
  let isSelecting = false;
  let firstCol: PartialCell;
  let firstRow: PartialCell;

  let areaLeft = {} as Cell;
  let areaTop = {} as Cell;
  let areaStart = {} as Cell;

  watchFn(scroll, () => {
    firstCol = computeFirstVisibleColumn(scroll().x);
    firstRow = computeFirstVisibleRow(scroll().y);
  });

  function doSelection(ev: PointerEvent) {
    if (!isSelecting) return;
    updateSelection(ev);
  }

  function startSelection(ev: PointerEvent) {
    ev.preventDefault();
    getCellAtCursor(ev, areaStart);

    if (areaLeft.col == null || areaStart.col < areaLeft.col) {
      areaLeft = { ...areaStart };
    }

    if (areaTop.row == null || areaStart.row < areaTop.row) {
      areaTop = { ...areaStart };
    }

    updateSelection(ev);
    isSelecting = true;
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

  function updateSelection(ev: PointerEvent) {
    const areaEnd = getCellAtCursor(ev);

    const startCol = Math.min(areaStart.col, areaEnd.col);
    const endCol = Math.max(areaStart.col, areaEnd.col);
    const startRow = Math.min(areaStart.row, areaEnd.row);
    const endRow = Math.max(areaStart.row, areaEnd.row);

    if (!ctrlPressed()) {
      currentSheet().setLastSelectedRegions.byRef((sel) => sel.clear());
    }

    const sel = new Set(currentSheet().lastSelectedRegions());
    carveRegion(sel, startCol, startRow, endCol, endRow);
    currentSheet().setSelectedRegions(sel);

    if (cellText()[0] !== "=") {
      cellInputEl().blur();
    } else if (document.activeElement === cellInputEl()) {
      const selections = currentSheet().selectedRegions();
      if (!selections.size) return;

      let text = "";
      for (const selection of selections) {
        const region = parseRegion(selection);
        if (
          region.startCol === cellInputInfo().col &&
          region.startRow === cellInputInfo().row
        )
          return;

        if (text) text += ",";

        text += getCellId(region.startCol, region.startRow);
        if (
          region.startCol !== region.endCol ||
          region.startRow !== region.endRow
        ) {
          text = `${text}:${getCellId(region.endCol, region.endRow)}`;
        }
      }

      setCellText(
        lastFormulaRegion.text.slice(0, lastFormulaRegion.start) +
          text +
          lastFormulaRegion.text.slice(lastFormulaRegion.end),
      );

      cellInputEl().selectionStart = cellInputEl().selectionEnd =
        lastFormulaRegion.start + text.length;
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
          const quad = regionToQuad(parseRegion(r));
          quads.push({ x: quad[0], y: quad[1], w: quad[2], h: quad[3] });
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

  function endSelection(ev: PointerEvent) {
    if (isTouchscreen) {
      if (!isSelecting) startSelection(ev);
      setTouchSelecting(false);
    }
    if (!isSelecting) return;
    isSelecting = false;
    currentSheet().setLastSelectedRegions(
      new Set(currentSheet().selectedRegions()),
    );
  }

  function getCellAtCursor(ev: PointerEvent, c = {} as Cell) {
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

  function updateText() {
    if (!isCellInputVisible()) {
      const region = getSelectedRegion();
      setCellText(
        currentSheet().textCells()[getCellIdx(region.startCol, region.startRow)]
          ?.text ?? "",
      );
    }
  }

  return (
    <>
      <div
        $refFn={setScrollEl}
        class="absolute right-0"
        class:overflow-auto={!touchSelecting()}
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
          on:pointerdown={
            isTouchscreen ? undefined : (ev) => startSelection(ev)
          }
          g:onpointermove={doSelection}
          on:pointerup={endSelection}
          on:click={updateText}
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
                  {formatMap[t().cell.style.format](t().cell.computed)}
                </span>
              </div>
            )}
          />
        </div>
        <For
          each={currentSheet().selectedQuads()}
          do={(q) => (
            <div
              class="absolute bg-indigo-500/50 dark:bg-emerald-500/50 pointer-events-none"
              style:left={`${q().x}px`}
              style:top={`${q().y}px`}
              style:width={`${q().w}px`}
              style:height={`${q().h}px`}
            >
              <button
                $if={isTouchscreen}
                type="button"
                class="absolute no-color bg-indigo-500 dark:bg-emerald-500 rounded-full w-6 h-6 bottom-0 right-0 translate-1/2 pointer-events-auto"
                on:pointerdown={() => {
                  setTouchSelecting(true);
                  isSelecting = true;
                }}
              />
            </div>
          )}
        />
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
