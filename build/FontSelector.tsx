import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ8 = _jsx$template(`<strong>B</strong>`);
const _jsx$templ14 = _jsx$template(`<s>S</s>`);
const _jsx$templ12 = _jsx$template(`<u>U</u>`);
const _jsx$templ10 = _jsx$template(`<em>I</em>`);
const _jsx$templ0 = _jsx$template(`<option><!></option>`);
const _jsx$templ19 = _jsx$template(`<fieldset class="flex gap-2 h-full"><select class="h-full"><!></select><fieldset class="grid grid-cols-[1rem_3rem_1rem]"><button type="button" class="compact">-</button><input class="text-center"/><button type="button" class="compact">+</button></fieldset><div></div><!><!><!><!><div></div><!></fieldset>`);
const _jsx$templ17 = _jsx$template(`<strong>Aa</strong>`);

import { ref } from "jsx";
import FixedFor from "jsx/components/FixedFor";
import { currentSheet } from "./state";
import {
  DEFAULT_BOLD,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_ITALIC,
  DEFAULT_STRIKETHROUGH,
  DEFAULT_UNDERLINE,
  DIVIDER_STYLE,
  MAX_COLS,
} from "./config";
import { parseRegion, regionsOverlap } from "./region";
import type { FontStyle } from "./types";
import ColorPicker from "./ColorPicker";
import Checkbox from "./Checkbox";

export default function FontSelector() {
  function updateFont<K extends keyof FontStyle>(k: K, v: FontStyle[K]) {
    setSelectedFont.byRef((f) => {
      f[k] = v;
    });
    currentSheet().setTextCells.byRef((textCells) => {
      for (const cellIdx in textCells) {
        const idx = +cellIdx;
        const col = idx % MAX_COLS;
        const row = Math.floor(idx / MAX_COLS);
        for (const selection of currentSheet().selectedRegions()) {
          if (
            regionsOverlap(parseRegion(selection), {
              startCol: col,
              startRow: row,
              endCol: col,
              endRow: row,
            })
          ) {
            textCells[cellIdx].style[k] = v;
          }
        }
      }
    });
  }

  return (
    (() => {
const _jsx$el0 = _jsx$templ19(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_self_closing_element
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el4 = _jsx$el3.firstChild; // jsx_element
const _jsx$el5 = _jsx$el4.firstChild; // jsx_text
const _jsx$el6 = _jsx$el4.nextSibling; // jsx_self_closing_element
const _jsx$el7 = _jsx$el6.nextSibling; // jsx_element
const _jsx$el8 = _jsx$el7.firstChild; // jsx_text
const _jsx$el9 = _jsx$el3.nextSibling; // jsx_self_closing_element
const _jsx$el10 = _jsx$el9.nextSibling; // jsx_element
const _jsx$el11 = _jsx$el10.nextSibling; // jsx_element
const _jsx$el12 = _jsx$el11.nextSibling; // jsx_element
const _jsx$el13 = _jsx$el12.nextSibling; // jsx_element
const _jsx$el14 = _jsx$el13.nextSibling; // jsx_self_closing_element
const _jsx$el15 = _jsx$el14.nextSibling; // jsx_element

_jsx$addLocalEvent(_jsx$el1, "change", (ev) => updateFont("family", ev.currentTarget.value));
FixedFor.$$slots = {};
_jsx$insertChild(_jsx$el2, FixedFor({get each() { return fontList }, do: (f) => (
            (() => {
const _jsx$el0 = _jsx$templ0(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_expression

_jsx$setAttribute(_jsx$el0, "selected", f() === selectedFont().family);
_jsx$insertChild(_jsx$el1, () => f());

return _jsx$el0;
})()
          ), }));
_jsx$addLocalEvent(_jsx$el4, "click", () => updateFont("size", selectedFont().size - 1));
_jsx$trackAttribute(_jsx$el6, "value", () => selectedFont().size);
_jsx$addLocalEvent(_jsx$el6, "input", (ev) => updateFont("size", +ev.currentTarget.value));
_jsx$addLocalEvent(_jsx$el7, "click", () => updateFont("size", selectedFont().size + 1));
_jsx$setAttribute(_jsx$el9, "class", DIVIDER_STYLE);
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ8(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el10, Checkbox({get checked() { return selectedFont().bold }, onChange: (v) => updateFont("bold", v), }, Checkbox.$$slots));
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ10(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el11, Checkbox({get checked() { return selectedFont().italic }, onChange: (v) => updateFont("italic", v), }, Checkbox.$$slots));
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ12(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el12, Checkbox({get checked() { return selectedFont().underline }, onChange: (v) => updateFont("underline", v), }, Checkbox.$$slots));
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ14(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el13, Checkbox({get checked() { return selectedFont().strikethrough }, onChange: (v) => updateFont("strikethrough", v), }, Checkbox.$$slots));
_jsx$setAttribute(_jsx$el14, "class", DIVIDER_STYLE);
ColorPicker.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ17(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el15, ColorPicker({get color() { return selectedFont().color }, onChange: (v) => updateFont("color", v), }, ColorPicker.$$slots));

return _jsx$el0;
})()
  );
}

const fontList = [
  "Amatic SC",
  "Caveat",
  "Comfortaa",
  "Courier Prime",
  "EB Garamond",
  "Exo",
  "JetBrainsMono",
  "Lexend",
  "Lobster",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Nunito",
  "Oswald",
  "Pacifico",
  "Playfair Display",
  "Roboto",
  "Roboto Mono",
  "Roboto Serif",
  "Spectral",
];

export const [selectedFont, setSelectedFont] = ref<FontStyle>({
  family: DEFAULT_FONT_FAMILY,
  size: DEFAULT_FONT_SIZE,
  color: DEFAULT_FONT_COLOR,
  bold: DEFAULT_BOLD,
  italic: DEFAULT_ITALIC,
  underline: DEFAULT_UNDERLINE,
  strikethrough: DEFAULT_STRIKETHROUGH,
});
