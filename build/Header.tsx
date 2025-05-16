import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { template as _jsx$template } from "jsx";
import { trackClass as _jsx$trackClass } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";
import { conditionalRender as _jsx$conditionalRender } from "jsx";

const _jsx$templ18 = _jsx$template(`<header class="grid grid-cols-[auto_1fr_max-content] items-center gap-2 w-full p-2 bg-stone-300 text-zinc-900 dark:bg-zinc-950 dark:text-stone-100"><h1 class="text-black text-xl text-inherit font-bold px-3"><i></i> Sheets</h1><section class="overflow-auto flex h-full gap-2 *:flex-none *:w-max scrollbar-hidden min-[825px]:justify-end"><!><!><!><div></div><button data-icon type="button" class="px-2 rounded-sm h-full aspect-square" title="Column left"></button><button data-icon type="button" class="px-2 rounded-sm h-full aspect-square" title="Column right"></button><button data-icon type="button" class="px-2 rounded-sm h-full aspect-square" title="Row down"></button><button data-icon type="button" class="px-2 rounded-sm h-full aspect-square" title="Row up"></button><div></div><button type="button" class="px-2 rounded-sm">SAVE</button><button type="button" class="px-2 rounded-sm font-bold h-full aspect-square" title="Debug Info">?</button><div></div><button type="button" class="min-w-4 px-2 rounded-sm h-full aspect-square"><i><!></i></button></section><button data-icon type="button" class="rounded-sm min-[825px]:hidden!"></button></header>`);
const _jsx$templ2 = _jsx$template(`<button type="button" class="px-2 h-full rounded-sm bg-indigo-500 hover:bg-indigo-700 text-zinc-50 dark:bg-emerald-500 dark:hover:bg-emerald-300 dark:text-zinc-900"><!></button>`);

import { ref } from "jsx";
import "./render";
import CellColorPicker from "./CellColorPicker";
import FontSelector from "./FontSelector";
import {
  computeCells,
  currentSheet,
  prefersDark,
  setPrefersDark,
  setTouchSelection,
  touchSelection,
} from "./state";
import { isTouchscreen } from "./utils";
import { decodeXLSXData, encodeXLSXData, formatSheetData } from "./saves";
import { DIVIDER_STYLE, MAX_COLS } from "./config";
import { parseRegion } from "./region";

export const [dbg, setDbg] = ref(false);

export default function Header() {
  let controlsEl!: HTMLElement;

  function insertLine(isRow: boolean, delta: number) {
    const region = parseRegion(
      currentSheet().selectedRegions().values().next().value ?? "0,0:0,0",
    );

    const insertAt = (isRow ? region.startRow : region.startCol) + delta;

    const getDim = isRow
      ? (i: number) => Math.floor(i / MAX_COLS)
      : (i: number) => i % MAX_COLS;

    const getNewIndex = isRow
      ? (i: number) =>
          (Math.floor(i / MAX_COLS) + 1) * MAX_COLS + (i % MAX_COLS)
      : (i: number) =>
          Math.floor(i / MAX_COLS) * MAX_COLS + ((i % MAX_COLS) + 1);

    currentSheet().setTextCells.byRef((textCells) => {
      const cellIndices = Object.keys(textCells)
        .map(Number)
        .sort((a, b) => b - a);

      for (const i of cellIndices) {
        if (getDim(i) >= insertAt) {
          const newIdx = getNewIndex(i);
          textCells[newIdx] = textCells[i];
          delete textCells[i];
        }
      }

      computeCells(textCells);
    });
  }

  return (
    (() => {
const _jsx$el0 = _jsx$templ18(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_element
const _jsx$el3 = _jsx$el2.firstChild; // jsx_text
const _jsx$el4 = _jsx$el2.nextSibling; // jsx_text
const _jsx$el5 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el6 = _jsx$el5.firstChild; // jsx_element
const _jsx$el7 = _jsx$el6.nextSibling; // jsx_self_closing_element
const _jsx$el8 = _jsx$el7.nextSibling; // jsx_self_closing_element
const _jsx$el9 = _jsx$el8.nextSibling; // jsx_self_closing_element
const _jsx$el10 = _jsx$el9.nextSibling; // jsx_element
const _jsx$el11 = _jsx$el10.firstChild; // jsx_text
const _jsx$el12 = _jsx$el10.nextSibling; // jsx_element
const _jsx$el13 = _jsx$el12.firstChild; // jsx_text
const _jsx$el14 = _jsx$el12.nextSibling; // jsx_element
const _jsx$el15 = _jsx$el14.firstChild; // jsx_text
const _jsx$el16 = _jsx$el14.nextSibling; // jsx_element
const _jsx$el17 = _jsx$el16.firstChild; // jsx_text
const _jsx$el18 = _jsx$el16.nextSibling; // jsx_self_closing_element
const _jsx$el19 = _jsx$el18.nextSibling; // jsx_element
const _jsx$el20 = _jsx$el19.firstChild; // jsx_text
const _jsx$el21 = _jsx$el19.nextSibling; // jsx_element
const _jsx$el22 = _jsx$el21.firstChild; // jsx_text
const _jsx$el23 = _jsx$el21.nextSibling; // jsx_self_closing_element
const _jsx$el24 = _jsx$el23.nextSibling; // jsx_element
const _jsx$el25 = _jsx$el24.firstChild; // jsx_element
const _jsx$el26 = _jsx$el25.firstChild; // jsx_expression
const _jsx$el27 = _jsx$el5.nextSibling; // jsx_element
const _jsx$el28 = _jsx$el27.firstChild; // jsx_text

controlsEl = _jsx$el5;
_jsx$conditionalRender(_jsx$el6, (() => {
const _jsx$el0 = _jsx$templ2(); // root[false]/component[false]/conditional[true]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_expression

_jsx$addLocalEvent(_jsx$el0, "click", () => setTouchSelection(!touchSelection()));
_jsx$insertChild(_jsx$el1, () => touchSelection() ? "Selecting" : "Select");

return _jsx$el0;
}), () => isTouchscreen);
FontSelector.$$slots = {};
_jsx$insertChild(_jsx$el7, FontSelector({}));
CellColorPicker.$$slots = {};
_jsx$insertChild(_jsx$el8, CellColorPicker({}));
_jsx$setAttribute(_jsx$el9, "class", DIVIDER_STYLE);
_jsx$addLocalEvent(_jsx$el10, "click", () => insertLine(false, 0));
_jsx$addLocalEvent(_jsx$el12, "click", () => insertLine(false, 1));
_jsx$addLocalEvent(_jsx$el14, "click", () => insertLine(true, 1));
_jsx$addLocalEvent(_jsx$el16, "click", () => insertLine(true, 0));
_jsx$setAttribute(_jsx$el18, "class", DIVIDER_STYLE);
_jsx$addLocalEvent(_jsx$el19, "click", () => {
            const encoded = encodeXLSXData(formatSheetData());
            console.log("Encoded", encoded);
            console.log("Decoded", decodeXLSXData(encoded));
          });
_jsx$trackClass(_jsx$el21, "selected", () => dbg());
_jsx$addLocalEvent(_jsx$el21, "click", () => setDbg(!dbg()));
_jsx$setAttribute(_jsx$el23, "class", DIVIDER_STYLE);
_jsx$addLocalEvent(_jsx$el24, "click", () => setPrefersDark(!prefersDark()));
_jsx$insertChild(_jsx$el26, () => prefersDark() ? "" : "");
_jsx$addLocalEvent(_jsx$el27, "click", () =>
          controlsEl.scrollTo({
            left: controlsEl.scrollWidth,
            behavior: "smooth",
          }));

return _jsx$el0;
})()
  );
}
