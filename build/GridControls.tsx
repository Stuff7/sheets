import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { addGlobalEvent as _jsx$addGlobalEvent } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";
import { trackClass as _jsx$trackClass } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { conditionalRender as _jsx$conditionalRender } from "jsx";
import { template as _jsx$template } from "jsx";
import { trackCssProperty as _jsx$trackCssProperty } from "jsx";
import { createGlobalEvent as _jsx$createGlobalEvent } from "jsx";

const _jsx$templ2 = _jsx$template(`<div class="absolute text-wrap break-all py-1 px-2"><!><!></div>`);
const _jsx$templ1 = _jsx$template(`<span><!></span>`);
const _jsx$templ11 = _jsx$template(`<p>Colored:<!><!></p>`);
const _jsx$templ16 = _jsx$template(`<p>inputCellInfo: <!></p>`);
const _jsx$templ10 = _jsx$template(`<div class="absolute right-0"><div tabindex="0"><!></div><!><pre class="absolute z-10 h-8 w-25 p-1 outline outline-indigo-500 dark:outline-emerald-500 whitespace-pre-wrap pointer-events-none"><!><strong class="absolute -top-6 -left-1 p-1 font-mono"><!></strong></pre></div>`);
const _jsx$templ6 = _jsx$template(`<div class="absolute bg-indigo-500/50 dark:bg-emerald-500/50 pointer-events-none"><!></div>`);
const _jsx$templ5 = _jsx$template(`<button type="button" class="absolute no-color bg-indigo-500 dark:bg-emerald-500 rounded-full w-6 h-6 bottom-0 right-0 translate-1/2 pointer-events-auto"></button>`);
const _jsx$templ14 = _jsx$template(`<p>ColOffsets: <!></p>`);
const _jsx$templ0 = _jsx$template(`<strong class="font-mono text-base font-bold not-italic text-red-500">#ERROR!</strong>`);
const _jsx$templ13 = _jsx$template(`<p>Texts: <!></p>`);
const _jsx$templ12 = _jsx$template(`<p>Selected:<!><!></p>`);
const _jsx$templ15 = _jsx$template(`<p>RowOffsets: <!></p>`);

window._jsx$global_event_pointermove = window._jsx$global_event_pointermove || _jsx$createGlobalEvent("pointermove");
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
    [(() => {
const _jsx$el0 = _jsx$templ10(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[true]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_self_closing_element
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_self_closing_element
const _jsx$el4 = _jsx$el3.nextSibling; // jsx_element
const _jsx$el5 = _jsx$el4.firstChild; // jsx_expression
const _jsx$el6 = _jsx$el5.nextSibling; // jsx_element
const _jsx$el7 = _jsx$el6.firstChild; // jsx_expression

setScrollEl(_jsx$el0);
_jsx$trackClass(_jsx$el0, "overflow-auto", () => !touchSelecting());
_jsx$trackCssProperty(_jsx$el0, "top", () => `${canvasRect().y}px`);
_jsx$trackCssProperty(_jsx$el0, "width", () => `${canvasRect().width}px`);
_jsx$trackCssProperty(_jsx$el0, "height", () => `${canvasRect().height}px`);
_jsx$addLocalEvent(_jsx$el0, "scroll", (ev) =>
          setScroll({
            x: ev.currentTarget.scrollLeft,
            y: ev.currentTarget.scrollTop,
          }));
_jsx$trackCssProperty(_jsx$el1, "width", () => `${CELL_W * MAX_COLS + totalOffsets(currentSheet().colOffsets())}px`);
_jsx$trackCssProperty(_jsx$el1, "height", () => `${CELL_H * MAX_ROWS + totalOffsets(currentSheet().rowOffsets())}px`);
_jsx$addLocalEvent(_jsx$el1, "pointerdown", isTouchscreen ? undefined : (ev) => startSelection(ev));
_jsx$addGlobalEvent(window._jsx$global_event_pointermove, _jsx$el1, doSelection);
_jsx$addLocalEvent(_jsx$el1, "pointerup", endSelection);
_jsx$addLocalEvent(_jsx$el1, "click", updateText);
_jsx$addLocalEvent(_jsx$el1, "dblclick", showCellInput);
For.$$slots = {};
_jsx$insertChild(_jsx$el2, For({get each() { return currentSheet().textQuads() }, do: (t) => (
              (() => {
const _jsx$el0 = _jsx$templ2(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_element

_jsx$trackCssProperty(_jsx$el0, "font-family", () => t().cell.style.family);
_jsx$trackCssProperty(_jsx$el0, "font-size", () => `${t().cell.style.size}px`);
_jsx$trackCssProperty(_jsx$el0, "font-weight", () => t().cell.style.bold ? "bold" : "normal");
_jsx$trackCssProperty(_jsx$el0, "font-style", () => t().cell.style.italic ? "italic" : "normal");
_jsx$trackCssProperty(_jsx$el0, "text-decoration-line", () => t().cell.computed instanceof Error
                    ? ""
                    : `${t().cell.style.underline ? "underline " : ""}${t().cell.style.strikethrough ? "line-through" : ""}`);
_jsx$trackCssProperty(_jsx$el0, "color", () => t().cell.style.color);
_jsx$trackCssProperty(_jsx$el0, "left", () => `${t().x}px`);
_jsx$trackCssProperty(_jsx$el0, "top", () => `${t().y}px`);
_jsx$trackCssProperty(_jsx$el0, "width", () => `${t().w}px`);
_jsx$trackCssProperty(_jsx$el0, "height", () => `${t().h}px`);
_jsx$conditionalRender(_jsx$el1, (() => {
const _jsx$el0 = _jsx$templ0(); // root[false]/component[false]/conditional[true]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text

_jsx$trackAttribute(_jsx$el0, "title", () => t().cell.computed.toString());

return _jsx$el0;
}), () => t().cell.computed instanceof Error);
_jsx$conditionalRender(_jsx$el2, (() => {
const _jsx$el0 = _jsx$templ1(); // root[false]/component[false]/conditional[true]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_expression

_jsx$insertChild(_jsx$el1, () => formatMap[t().cell.style.format](t().cell.computed));

return _jsx$el0;
}), () => typeof t().cell.computed === "string");

return _jsx$el0;
})()
            ), }));
For.$$slots = {};
_jsx$insertChild(_jsx$el3, For({get each() { return currentSheet().selectedQuads() }, do: (q) => (
            (() => {
const _jsx$el0 = _jsx$templ6(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element

_jsx$trackCssProperty(_jsx$el0, "left", () => `${q().x}px`);
_jsx$trackCssProperty(_jsx$el0, "top", () => `${q().y}px`);
_jsx$trackCssProperty(_jsx$el0, "width", () => `${q().w}px`);
_jsx$trackCssProperty(_jsx$el0, "height", () => `${q().h}px`);
_jsx$conditionalRender(_jsx$el1, (() => {
const _jsx$el0 = _jsx$templ5(); // root[false]/component[false]/conditional[true]/transition[false]/template-child[false]

_jsx$addLocalEvent(_jsx$el0, "pointerdown", () => {
                  setTouchSelecting(true);
                  isSelecting = true;
                });

return _jsx$el0;
}), () => isTouchscreen);

return _jsx$el0;
})()
          ), }));
_jsx$trackClass(_jsx$el4, "hidden", () => !isCellInputVisible());
_jsx$trackCssProperty(_jsx$el4, "background-color", () => defaultCellColor());
_jsx$trackCssProperty(_jsx$el4, "left", () => `${cellInputInfo().x}px`);
_jsx$trackCssProperty(_jsx$el4, "top", () => `${cellInputInfo().y}px`);
_jsx$trackCssProperty(_jsx$el4, "width", () => `${cellInputInfo().width}px`);
_jsx$trackCssProperty(_jsx$el4, "height", () => `${cellInputInfo().height}px`);
_jsx$trackCssProperty(_jsx$el4, "font-family", () => selectedFont().family);
_jsx$trackCssProperty(_jsx$el4, "font-size", () => `${selectedFont().size}px`);
_jsx$trackCssProperty(_jsx$el4, "font-weight", () => selectedFont().bold ? "bold" : "normal");
_jsx$trackCssProperty(_jsx$el4, "font-style", () => selectedFont().italic ? "italic" : "normal");
_jsx$trackCssProperty(_jsx$el4, "text-decoration-line", () => `${selectedFont().underline ? "underline " : ""}${selectedFont().strikethrough ? "line-through" : ""}`);
_jsx$trackCssProperty(_jsx$el4, "color", () => selectedFont().color);
_jsx$insertChild(_jsx$el5, () => cellText());
_jsx$insertChild(_jsx$el7, () => cellInputInfo().id);

return _jsx$el0;
})(), (() => {
Dbg.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ11(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[true]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression
const _jsx$el3 = _jsx$el2.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, " ");
_jsx$insertChild(_jsx$el3, () => JSON.stringify(
            currentSheet().colorRegions(),
            (_, value) => (value instanceof Set ? Array.from(value) : value),
            2,
          ));

return _jsx$el0;
})(),(() => {
const _jsx$el0 = _jsx$templ12(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression
const _jsx$el3 = _jsx$el2.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, " ");
_jsx$insertChild(_jsx$el3, () => JSON.stringify([...currentSheet().selectedRegions()], null, 2));

return _jsx$el0;
})(),(() => {
const _jsx$el0 = _jsx$templ13(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, () => JSON.stringify(currentSheet().textCells(), null, 2));

return _jsx$el0;
})(),(() => {
const _jsx$el0 = _jsx$templ14(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, () => JSON.stringify(currentSheet().colOffsets()));

return _jsx$el0;
})(),(() => {
const _jsx$el0 = _jsx$templ15(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, () => JSON.stringify(currentSheet().rowOffsets()));

return _jsx$el0;
})(),(() => {
const _jsx$el0 = _jsx$templ16(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, () => JSON.stringify(cellInputInfo(), null, 2));

return _jsx$el0;
})()]}
const _jsx$el0 = Dbg({}, Dbg.$$slots);

return _jsx$el0;
})(), ]

  );
}
