import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { createGlobalEvent as _jsx$createGlobalEvent } from "jsx";
import { addGlobalEvent as _jsx$addGlobalEvent } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { trackCssProperty as _jsx$trackCssProperty } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ2 = _jsx$template(`<button type="button" class="relative"><!><div></div></button>`);
const _jsx$templ6 = _jsx$template(`<button type="button" class="block w-full px-2 min-w-[56.5px] relative"><!><div></div></button>`);
const _jsx$templ8 = _jsx$template(`<aside class="relative overflow-visible max-h-dvh z-10 select-none"><!></aside>`);
const _jsx$templ0 = _jsx$template(`<button class="relative dark:bg-zinc-800 bg-zinc-200 z-11" data-icon type="button" title="Go to the 1st cell"></button>`);
const _jsx$templ4 = _jsx$template(`<header class="relative overflow-visible max-w-dvw whitespace-nowrap z-10 select-none"><!></header>`);

window._jsx$global_event_touchmove = window._jsx$global_event_touchmove || _jsx$createGlobalEvent("touchmove");
window._jsx$global_event_mousemove = window._jsx$global_event_mousemove || _jsx$createGlobalEvent("mousemove");
window._jsx$global_event_mouseup = window._jsx$global_event_mouseup || _jsx$createGlobalEvent("mouseup");
window._jsx$global_event_touchend = window._jsx$global_event_touchend || _jsx$createGlobalEvent("touchend");
import { ref, watchFn } from "jsx";
import For from "jsx/components/For";
import {
  canvasRect,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  getEffectiveCellHeight,
  getEffectiveCellWidth,
  scroll,
  scrollEl,
  currentSheet,
  ctrlPressed,
} from "./state";
import {
  toAlphaUpper,
  toAlphaLower,
  fromAlphaUpper,
  getMousePosition,
  fromAlphaLower,
} from "./utils";
import { CELL_W, CELL_H, MAX_ROWS, MAX_COLS } from "./config";
import { carveRegion } from "./region";

const RESIZE_STYLE = "absolute z-1";

export default function GridAxes() {
  const [cellKeys, setCellKeys] = ref({
    cols: [] as string[],
    rows: [] as string[],
  });

  function computeVisibleRange(
    firstIndex: number,
    size: number,
    getEffectiveSize: (index: number) => number,
  ): number {
    let cumSize = 0;
    let count = 0;
    let currentIndex = firstIndex;

    while (cumSize < size + getEffectiveSize(firstIndex)) {
      cumSize += getEffectiveSize(currentIndex);
      currentIndex++;
      count++;
    }

    return count;
  }

  watchFn(
    () => [
      canvasRect(),
      scroll(),
      currentSheet().colOffsets(),
      currentSheet().rowOffsets(),
    ],
    () => {
      const { width, height } = canvasRect();
      const { index: firstCol } = computeFirstVisibleColumn(scroll().x);
      const { index: firstRow } = computeFirstVisibleRow(scroll().y);
      if (firstCol < 0 && firstRow < 0) return;

      const colCount = computeVisibleRange(
        firstCol,
        width,
        getEffectiveCellWidth,
      );
      const rowCount = computeVisibleRange(
        firstRow,
        height,
        getEffectiveCellHeight,
      );

      setCellKeys.byRef((k) => {
        if (firstCol >= 0) {
          k.cols.length = 0;
          for (let i = firstCol; i < firstCol + colCount; i++) {
            k.cols.push(toAlphaUpper(i));
          }
        }
        if (firstRow >= 0) {
          k.rows.length = 0;
          for (let i = firstRow; i < firstRow + rowCount; i++) {
            k.rows.push(toAlphaLower(i));
          }
        }
      });
    },
  );

  let lastPos = { x: 0, y: 0 };
  let resizedCol = -1;
  function startColResize(ev: MouseEvent | TouchEvent, colId: string) {
    lastPos = getMousePosition(ev);
    resizedCol = fromAlphaUpper(colId);
  }

  let resizedRow = -1;
  function startRowResize(ev: MouseEvent | TouchEvent, rowId: string) {
    lastPos = getMousePosition(ev);
    resizedRow = fromAlphaLower(rowId);
  }

  function resizeCell(
    ev: MouseEvent | TouchEvent,
    resizedIndex: number,
    setOffsets: (fn: (offsets: Record<number, number>) => void) => void,
    cellSize: number,
  ) {
    if (resizedIndex === -1) return;
    const pos = getMousePosition(ev);
    setOffsets((offsets) => {
      const newOffset =
        (offsets[resizedIndex] ?? 0) +
        (cellSize === CELL_W ? pos.x - lastPos.x : pos.y - lastPos.y);
      offsets[resizedIndex] = Math.max(-cellSize, newOffset);
      lastPos = pos;
    });
  }

  function endResize() {
    resizedCol = -1;
    resizedRow = -1;
  }

  let lastScrollX = scroll().x;
  let lastScrollY = scroll().x;
  const [headerOffset, setHeaderOffset] = ref(0);
  const [asideOffset, setAsideOffset] = ref(0);
  watchFn(scroll, () => {
    if (scroll().x !== lastScrollX) {
      const offset = computeFirstVisibleColumn(scroll().x).remainder;
      if (offset >= 0) setHeaderOffset(offset);
      lastScrollX = scroll().x;
    }
    if (scroll().y !== lastScrollY) {
      const offset = computeFirstVisibleRow(scroll().y).remainder;
      if (offset >= 0) setAsideOffset(offset);
      lastScrollY = scroll().y;
    }
  });

  function selectCol(ev: MouseEvent | TouchEvent, col: number) {
    if (ev.target !== ev.currentTarget) return;
    currentSheet().setLastSelectedRegions.byRef((sel) => {
      if (!ctrlPressed()) sel.clear();
      carveRegion(sel, col, 0, col, MAX_ROWS);
    });
  }

  function selectRow(ev: MouseEvent | TouchEvent, row: number) {
    if (ev.target !== ev.currentTarget) return;
    currentSheet().setLastSelectedRegions.byRef((sel) => {
      if (!ctrlPressed()) sel.clear();
      carveRegion(sel, 0, row, MAX_COLS, row);
    });
  }

  return (
    [(() => {
const _jsx$el0 = _jsx$templ0(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[true]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text

_jsx$addLocalEvent(_jsx$el0, "click", () =>
          scrollEl().scrollTo({ top: 0, left: 0, behavior: "smooth" }));

return _jsx$el0;
})(), (() => {
const _jsx$el0 = _jsx$templ4(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[true]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element

_jsx$trackCssProperty(_jsx$el0, "left", () => `-${headerOffset()}px`);
For.$$slots = {};
_jsx$insertChild(_jsx$el1, For({get each() { return cellKeys().cols }, do: (col, i) => (
            (() => {
const _jsx$el0 = _jsx$templ2(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_expression
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_self_closing_element

_jsx$trackAttribute(_jsx$el0, "tabindex", () => i === cellKeys().cols.length - 1 ? -1 : undefined);
_jsx$addLocalEvent(_jsx$el0, "click", (ev) => selectCol(ev, fromAlphaUpper(col())));
_jsx$trackCssProperty(_jsx$el0, "width", () => `${getEffectiveCellWidth(fromAlphaUpper(col()))}px`);
_jsx$insertChild(_jsx$el1, () => col());
_jsx$setAttribute(_jsx$el2, "class", `${RESIZE_STYLE} cursor-col-resize top-0 right-0 h-full w-3`);
_jsx$addLocalEvent(_jsx$el2, "mousedown", (ev) => startColResize(ev, col()));
_jsx$addGlobalEvent(window._jsx$global_event_mousemove, _jsx$el2, (ev) =>
                  resizeCell(
                    ev,
                    resizedCol,
                    currentSheet().setColOffsets.byRef,
                    CELL_W,
                  ));
_jsx$addGlobalEvent(window._jsx$global_event_mouseup, _jsx$el2, endResize);
_jsx$addLocalEvent(_jsx$el2, "touchstart", (ev) => startColResize(ev, col()));
_jsx$addGlobalEvent(window._jsx$global_event_touchmove, _jsx$el2, (ev) =>
                  resizeCell(
                    ev,
                    resizedCol,
                    currentSheet().setColOffsets.byRef,
                    CELL_W,
                  ));
_jsx$addGlobalEvent(window._jsx$global_event_touchend, _jsx$el2, endResize);

return _jsx$el0;
})()
          ), }));

return _jsx$el0;
})(), (() => {
const _jsx$el0 = _jsx$templ8(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[true]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element

_jsx$trackCssProperty(_jsx$el0, "top", () => `-${asideOffset()}px`);
For.$$slots = {};
_jsx$insertChild(_jsx$el1, For({get each() { return cellKeys().rows }, do: (row, i) => (
            (() => {
const _jsx$el0 = _jsx$templ6(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_expression
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_self_closing_element

_jsx$trackAttribute(_jsx$el0, "tabindex", () => i === cellKeys().rows.length - 1 ? -1 : undefined);
_jsx$addLocalEvent(_jsx$el0, "click", (ev) => selectRow(ev, fromAlphaLower(row())));
_jsx$trackCssProperty(_jsx$el0, "height", () => `${getEffectiveCellHeight(fromAlphaLower(row()))}px`);
_jsx$insertChild(_jsx$el1, () => row());
_jsx$setAttribute(_jsx$el2, "class", `${RESIZE_STYLE} cursor-row-resize left-0 bottom-0 w-full h-3`);
_jsx$addLocalEvent(_jsx$el2, "mousedown", (ev) => startRowResize(ev, row()));
_jsx$addGlobalEvent(window._jsx$global_event_mousemove, _jsx$el2, (ev) =>
                  resizeCell(
                    ev,
                    resizedRow,
                    currentSheet().setRowOffsets.byRef,
                    CELL_H,
                  ));
_jsx$addGlobalEvent(window._jsx$global_event_mouseup, _jsx$el2, endResize);
_jsx$addLocalEvent(_jsx$el2, "touchstart", (ev) => startRowResize(ev, row()));
_jsx$addGlobalEvent(window._jsx$global_event_touchmove, _jsx$el2, (ev) =>
                  resizeCell(
                    ev,
                    resizedRow,
                    currentSheet().setRowOffsets.byRef,
                    CELL_H,
                  ));
_jsx$addGlobalEvent(window._jsx$global_event_touchend, _jsx$el2, endResize);

return _jsx$el0;
})()
          ), }));

return _jsx$el0;
})(), ]

  );
}
