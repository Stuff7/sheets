import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { template as _jsx$template } from "jsx";

const _jsx$templ2 = _jsx$template(`<label class="flex gap-2 pl-6 items-center focus-children outlined"><i></i><textarea class="w-full font-mono py-1 outline-none resize-none max-h-20" rows="1"></textarea></label>`);

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
    (() => {
const _jsx$el0 = _jsx$templ2(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_text
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_self_closing_element

setCellInputEl(_jsx$el3);
_jsx$trackAttribute(_jsx$el3, "value", () => cellText());
_jsx$addLocalEvent(_jsx$el3, "keydown", onSubmit);
_jsx$addLocalEvent(_jsx$el3, "change", (ev) => addTextCell(ev.currentTarget.value));
_jsx$addLocalEvent(_jsx$el3, "input", onInput);
_jsx$addLocalEvent(_jsx$el3, "focus", onFocus);
_jsx$addLocalEvent(_jsx$el3, "blur", () => setIsCellInputVisible(false));

return _jsx$el0;
})()
  );
}
