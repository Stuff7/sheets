import {
  cellText,
  currentSheet,
  setCellInputEl,
  setCellText,
  sheets,
  setIsCellInputVisible,
  positionCellInput,
  cellInputInfo,
} from "./state";
import { getCellIdx } from "./utils";
import { selectedFont } from "./FontSelector";
import type { Sheets } from "./types";
import { evaluateFormula } from "./sheetFormula/evaluator";

export default function CellInput() {
  function addTextCell(text: string) {
    if (!text) {
      currentSheet().setTextCells.byRef((cells) => {
        const idx = getCellIdx(cellInputInfo().col, cellInputInfo().row);
        delete cells[idx];
      });
      setCellText("");
      return;
    }

    currentSheet().setTextCells.byRef((cells) => {
      const idx = getCellIdx(cellInputInfo().col, cellInputInfo().row);
      cells[idx] = {
        text,
        computed: text,
        style: { ...selectedFont() },
      };

      const sheetRecord: Sheets = {};
      for (const sheet of sheets()) {
        sheetRecord[sheet.name()] = sheet.textCells();
      }

      for (const value of Object.values(cells)) {
        try {
          value.computed =
            value.text[0] === "="
              ? evaluateFormula(
                  value.text.slice(1),
                  currentSheet().name(),
                  sheetRecord,
                ).toString()
              : value.text;
        } catch (e) {
          value.computed = e;
          console.error(e);
        }
      }
    });
    setCellText("");
  }

  function onInput(this: HTMLTextAreaElement) {
    setCellText(this.value);
    this.style.height = "";
    this.style.height = `${this.scrollHeight}px`;
  }

  function onSubmit(this: HTMLTextAreaElement, ev: KeyboardEvent) {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      this.blur();
    }
  }

  function onFocus() {
    positionCellInput();
    setIsCellInputVisible(true);
  }

  return (
    <label class="flex gap-2 pl-6 items-center focus-children outlined">
      <i></i>
      <textarea
        $refFn={setCellInputEl}
        class="w-full font-mono py-1 outline-none resize-none max-h-20"
        $value={cellText()}
        rows={1}
        on:keydown={onSubmit}
        on:change={(ev) => addTextCell(ev.currentTarget.value)}
        on:input={onInput}
        on:focus={onFocus}
        on:blur={() => setIsCellInputVisible(false)}
      />
    </label>
  );
}
