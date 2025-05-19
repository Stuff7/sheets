import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { trackClass as _jsx$trackClass } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ20 = _jsx$template(`<header class="grid grid-cols-[auto_1fr_max-content] items-center gap-2 w-full p-2 bg-stone-300 text-zinc-900 dark:bg-zinc-950 dark:text-stone-100"><h1 class="text-black text-xl text-inherit font-bold px-3"><i></i> Sheets</h1><section class="overflow-auto flex h-full gap-2 *:flex-none *:w-max scrollbar-hidden min-[1245px]:justify-end"><button data-icon type="button" class="rounded-square" title="Export"></button><label data-button data-icon title="Import" class="rounded-square leading-[27px]"><input type="file" class="hidden"/></label><div></div><!><!><div></div><button data-icon type="button" class="rounded-square" title="Clear selection"></button><button data-icon type="button" class="rounded-square" title="Column left"></button><button data-icon type="button" class="rounded-square" title="Column right"></button><button data-icon type="button" class="rounded-square" title="Row down"></button><button data-icon type="button" class="rounded-square" title="Row up"></button><div></div><button data-icon type="button" class="rounded-square" title="Debug Info"></button><div></div><button data-icon type="button" class="min-w-4 rounded-square"><!></button></section><button data-icon type="button" class="rounded-sm min-[1245px]:hidden!"></button></header>`);

import { ref } from "jsx";
import "./render";
import CellColorPicker from "./CellColorPicker";
import FontSelector from "./FontSelector";
import {
  computeCells,
  createSheet,
  currentSheet,
  defaultCellColor,
  forEachSelectedTextCell,
  getSelectedRegion,
  prefersDark,
  setCurrentSheet,
  setPrefersDark,
  setSheets,
} from "./state";
import { decodeXLSXData, encodeXLSXData, formatSheetData } from "./saves";
import { DIVIDER_STYLE, MAX_COLS } from "./config";
import { Parser } from "./sheetFormula/parser";
import { shiftAST, stringify } from "./sheetFormula/evaluator";
import { parseRegion, regionToQuad } from "./region";

export const [dbg, setDbg] = ref(false);

export default function Header() {
  let controlsEl!: HTMLElement;

  function insertLine(isRow: boolean, delta: number) {
    const region = getSelectedRegion();
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

      for (const idxStr of Object.keys(textCells)) {
        const idx = Number(idxStr);
        let { text, computed, style } = textCells[idx];

        if (text.startsWith("=")) {
          const ast = new Parser(text.slice(1)).parseExpression();
          const shifted = shiftAST(ast, isRow, insertAt);
          text = `=${stringify(shifted)}`;
          textCells[idx] = { text, computed, style };
        }
      }

      computeCells(textCells);
    });
  }

  function clearSelection() {
    currentSheet().setTextCells.byRef((textCells) => {
      forEachSelectedTextCell(textCells, (_, idx) => delete textCells[idx]);
      computeCells(textCells);
    });
  }

  function exportData() {
    const encoded = encodeXLSXData(formatSheetData());
    const blob = new Blob([encoded], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "spreadsheet";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(this: HTMLInputElement) {
    const file = this.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) return;
      const data = new Uint8Array(reader.result);
      const decoded = decodeXLSXData(data);

      setSheets.byRef((sheets) => {
        sheets.length = 0;
        for (const name in decoded) {
          const s = createSheet(name);
          const d = decoded[name];

          s.setColOffsets(d.colOffsets);
          s.setRowOffsets(d.rowOffsets);
          s.setTextCells(d.texts);
          s.setColorRegions(d.regions);

          s.setColorQuads.byRef((colors) => {
            for (const color in d.regions) {
              if (color !== defaultCellColor()) {
                const c = colors[color] ?? [];
                c.length = 0;
                for (const k of d.regions[color]) {
                  c.push(...regionToQuad(parseRegion(k)));
                }
                colors[color] = c;
              }
            }
          });
          computeCells(s.textCells());
          sheets.push(s);
        }

        computeCells(sheets[0].textCells());
        setCurrentSheet(sheets[0]);
      });
    };

    reader.readAsArrayBuffer(file);
  }

  return (
    (() => {
const _jsx$el0 = _jsx$templ20(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_element
const _jsx$el3 = _jsx$el2.firstChild; // jsx_text
const _jsx$el4 = _jsx$el2.nextSibling; // jsx_text
const _jsx$el5 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el6 = _jsx$el5.firstChild; // jsx_element
const _jsx$el7 = _jsx$el6.firstChild; // jsx_text
const _jsx$el8 = _jsx$el6.nextSibling; // jsx_element
const _jsx$el9 = _jsx$el8.firstChild; // jsx_text
const _jsx$el10 = _jsx$el9.nextSibling; // jsx_self_closing_element
const _jsx$el11 = _jsx$el8.nextSibling; // jsx_self_closing_element
const _jsx$el12 = _jsx$el11.nextSibling; // jsx_self_closing_element
const _jsx$el13 = _jsx$el12.nextSibling; // jsx_self_closing_element
const _jsx$el14 = _jsx$el13.nextSibling; // jsx_self_closing_element
const _jsx$el15 = _jsx$el14.nextSibling; // jsx_element
const _jsx$el16 = _jsx$el15.firstChild; // jsx_text
const _jsx$el17 = _jsx$el15.nextSibling; // jsx_element
const _jsx$el18 = _jsx$el17.firstChild; // jsx_text
const _jsx$el19 = _jsx$el17.nextSibling; // jsx_element
const _jsx$el20 = _jsx$el19.firstChild; // jsx_text
const _jsx$el21 = _jsx$el19.nextSibling; // jsx_element
const _jsx$el22 = _jsx$el21.firstChild; // jsx_text
const _jsx$el23 = _jsx$el21.nextSibling; // jsx_element
const _jsx$el24 = _jsx$el23.firstChild; // jsx_text
const _jsx$el25 = _jsx$el23.nextSibling; // jsx_self_closing_element
const _jsx$el26 = _jsx$el25.nextSibling; // jsx_element
const _jsx$el27 = _jsx$el26.firstChild; // jsx_text
const _jsx$el28 = _jsx$el26.nextSibling; // jsx_self_closing_element
const _jsx$el29 = _jsx$el28.nextSibling; // jsx_element
const _jsx$el30 = _jsx$el29.firstChild; // jsx_expression
const _jsx$el31 = _jsx$el5.nextSibling; // jsx_element
const _jsx$el32 = _jsx$el31.firstChild; // jsx_text

controlsEl = _jsx$el5;
_jsx$addLocalEvent(_jsx$el6, "click", exportData);
_jsx$addLocalEvent(_jsx$el10, "change", importData);
_jsx$setAttribute(_jsx$el11, "class", DIVIDER_STYLE);
FontSelector.$$slots = {};
_jsx$insertChild(_jsx$el12, FontSelector({}));
CellColorPicker.$$slots = {};
_jsx$insertChild(_jsx$el13, CellColorPicker({}));
_jsx$setAttribute(_jsx$el14, "class", DIVIDER_STYLE);
_jsx$addLocalEvent(_jsx$el15, "click", clearSelection);
_jsx$addLocalEvent(_jsx$el17, "click", () => insertLine(false, 0));
_jsx$addLocalEvent(_jsx$el19, "click", () => insertLine(false, 1));
_jsx$addLocalEvent(_jsx$el21, "click", () => insertLine(true, 1));
_jsx$addLocalEvent(_jsx$el23, "click", () => insertLine(true, 0));
_jsx$setAttribute(_jsx$el25, "class", DIVIDER_STYLE);
_jsx$trackClass(_jsx$el26, "selected", () => dbg());
_jsx$addLocalEvent(_jsx$el26, "click", () => setDbg(!dbg()));
_jsx$setAttribute(_jsx$el28, "class", DIVIDER_STYLE);
_jsx$addLocalEvent(_jsx$el29, "click", () => setPrefersDark(!prefersDark()));
_jsx$insertChild(_jsx$el30, () => prefersDark() ? "" : "");
_jsx$addLocalEvent(_jsx$el31, "click", () =>
          controlsEl.scrollTo({
            left: controlsEl.scrollWidth,
            behavior: "smooth",
          }));

return _jsx$el0;
})()
  );
}
