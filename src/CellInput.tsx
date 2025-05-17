import {
  cellText,
  currentSheet,
  setCellInputEl,
  setCellText,
  setIsCellInputVisible,
  positionCellInput,
  cellInputInfo,
  computeCells,
  lastFormulaRegion,
} from "./state";
import { getCellIdx } from "./utils";
import { selectedFont } from "./FontSelector";

export default function CellInput() {
  let shouldSave = true;

  function addTextCell() {
    setIsCellInputVisible(false);

    if (!shouldSave) {
      shouldSave = true;
      setCellText("");
      return;
    }

    const text = cellText();
    const idx = getCellIdx(cellInputInfo().col, cellInputInfo().row);

    if (text) {
      currentSheet().setTextCells.byRef((cells) => {
        cells[idx] = {
          text,
          computed: text,
          style: { ...selectedFont() },
        };

        computeCells(cells);
      });
    } else {
      currentSheet().setTextCells.byRef((cells) => delete cells[idx]);
    }

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

  function onKeyUp(this: HTMLTextAreaElement, ev: KeyboardEvent) {
    if (
      ev.key === "Shift" ||
      ev.key === "Control" ||
      ev.key === "Alt" ||
      ev.key === "Meta"
    )
      return;

    lastFormulaRegion.start = this.selectionStart;
    lastFormulaRegion.end = this.selectionEnd;
    lastFormulaRegion.text = this.value;
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
        on:keyup={onKeyUp}
        on:input={onInput}
        on:focus={onFocus}
        on:blur={addTextCell}
      />
    </label>
  );
}
