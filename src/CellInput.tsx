import {
  cellText,
  currentSheet,
  setCellInputEl,
  setCellText,
  setIsCellInputVisible,
  positionCellInput,
  cellInputInfo,
  computeCells,
} from "./state";
import { getCellIdx } from "./utils";
import { selectedFont } from "./FontSelector";

export default function CellInput() {
  let shouldSave = true;
  function addTextCell(text: string) {
    if (!shouldSave) {
      shouldSave = true;
      setCellText("");
      return;
    }

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

      computeCells(cells);
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
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      shouldSave = false;
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
