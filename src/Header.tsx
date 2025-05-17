import { ref } from "jsx";
import "./render";
import CellColorPicker from "./CellColorPicker";
import FontSelector from "./FontSelector";
import {
  computeCells,
  currentSheet,
  forEachSelectedTextCell,
  getSelectedRegion,
  prefersDark,
  setPrefersDark,
  setTouchSelection,
  touchSelection,
} from "./state";
import { isTouchscreen } from "./utils";
import { decodeXLSXData, encodeXLSXData, formatSheetData } from "./saves";
import { DIVIDER_STYLE, MAX_COLS } from "./config";
import { Parser } from "./sheetFormula/parser";
import { shiftAST, stringify } from "./sheetFormula/evaluator";

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

  return (
    <header class="grid grid-cols-[auto_1fr_max-content] items-center gap-2 w-full p-2 bg-stone-300 text-zinc-900 dark:bg-zinc-950 dark:text-stone-100">
      <h1 class="text-black text-xl text-inherit font-bold px-3">
        <i></i> Sheets
      </h1>
      <section
        $ref={controlsEl}
        class="overflow-auto flex h-full gap-2 *:flex-none *:w-max scrollbar-hidden min-[1100px]:justify-end"
      >
        <button
          $if={isTouchscreen}
          type="button"
          class="px-2 h-full rounded-sm bg-indigo-500 hover:bg-indigo-700 text-zinc-50 dark:bg-emerald-500 dark:hover:bg-emerald-300 dark:text-zinc-900"
          on:click={() => setTouchSelection(!touchSelection())}
        >
          {touchSelection() ? "Selecting" : "Select"}
        </button>
        <FontSelector />
        <CellColorPicker />
        <div class={DIVIDER_STYLE} />
        <button
          data-icon
          type="button"
          class="rounded-square"
          title="Clear selection"
          on:click={clearSelection}
        >
          
        </button>
        <button
          data-icon
          type="button"
          class="rounded-square"
          title="Column left"
          on:click={() => insertLine(false, 0)}
        >
          
        </button>
        <button
          data-icon
          type="button"
          class="rounded-square"
          title="Column right"
          on:click={() => insertLine(false, 1)}
        >
          
        </button>
        <button
          data-icon
          type="button"
          class="rounded-square"
          title="Row down"
          on:click={() => insertLine(true, 1)}
        >
          
        </button>
        <button
          data-icon
          type="button"
          class="rounded-square"
          title="Row up"
          on:click={() => insertLine(true, 0)}
        >
          
        </button>
        <div class={DIVIDER_STYLE} />
        <button
          type="button"
          class="px-2 rounded-sm"
          on:click={() => {
            const encoded = encodeXLSXData(formatSheetData());
            console.log("Encoded", encoded);
            console.log("Decoded", decodeXLSXData(encoded));
          }}
        >
          SAVE
        </button>
        <button
          data-icon
          type="button"
          class="rounded-square"
          class:selected={dbg()}
          title="Debug Info"
          on:click={() => setDbg(!dbg())}
        >
          
        </button>
        <div class={DIVIDER_STYLE} />
        <button
          data-icon
          type="button"
          class="min-w-4 rounded-square"
          on:click={() => setPrefersDark(!prefersDark())}
        >
          {prefersDark() ? "" : ""}
        </button>
      </section>
      <button
        data-icon
        type="button"
        class="rounded-sm min-[1100px]:hidden!"
        on:click={() =>
          controlsEl.scrollTo({
            left: controlsEl.scrollWidth,
            behavior: "smooth",
          })
        }
      >
        
      </button>
    </header>
  );
}
