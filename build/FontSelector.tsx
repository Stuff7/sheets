import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ11 = _jsx$template(`<strong>B</strong>`);
const _jsx$templ15 = _jsx$template(`<u>U</u>`);
const _jsx$templ17 = _jsx$template(`<s>S</s>`);
const _jsx$templ20 = _jsx$template(`<strong>Aa</strong>`);
const _jsx$templ22 = _jsx$template(`<fieldset><select class="h-full"><!></select><select class="h-full"><!></select><fieldset class="grid grid-cols-[1rem_3rem_1rem]"><button type="button" class="compact">-</button><input class="text-center"/><button type="button" class="compact">+</button></fieldset><div></div><!><!><!><!><div></div><!></fieldset>`);
const _jsx$templ0 = _jsx$template(`<option><!></option>`);
const _jsx$templ3 = _jsx$template(`<option><!></option>`);
const _jsx$templ13 = _jsx$template(`<em>I</em>`);

import { ref } from "jsx";
import FixedFor from "jsx/components/FixedFor";
import { currentSheet, forEachSelectedTextCell } from "./state";
import {
  DEFAULT_BOLD,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_FORMAT,
  DEFAULT_FONT_SIZE,
  DEFAULT_ITALIC,
  DEFAULT_STRIKETHROUGH,
  DEFAULT_UNDERLINE,
  DIVIDER_STYLE,
} from "./config";
import type { FontStyle } from "./types";
import ColorPicker from "./ColorPicker";
import Checkbox from "./Checkbox";
import { isSafari } from "./utils";

export default function FontSelector() {
  function updateFont<K extends keyof FontStyle>(k: K, v: FontStyle[K]) {
    setSelectedFont.byRef((f) => {
      f[k] = v;
    });
    currentSheet().setTextCells.byRef((textCells) => {
      forEachSelectedTextCell(textCells, (tc) => {
        tc.style[k] = v;
      });
    });
  }

  return (
    (() => {
const _jsx$el0 = _jsx$templ22(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_self_closing_element
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el4 = _jsx$el3.firstChild; // jsx_self_closing_element
const _jsx$el5 = _jsx$el3.nextSibling; // jsx_element
const _jsx$el6 = _jsx$el5.firstChild; // jsx_element
const _jsx$el7 = _jsx$el6.firstChild; // jsx_text
const _jsx$el8 = _jsx$el6.nextSibling; // jsx_self_closing_element
const _jsx$el9 = _jsx$el8.nextSibling; // jsx_element
const _jsx$el10 = _jsx$el9.firstChild; // jsx_text
const _jsx$el11 = _jsx$el5.nextSibling; // jsx_self_closing_element
const _jsx$el12 = _jsx$el11.nextSibling; // jsx_element
const _jsx$el13 = _jsx$el12.nextSibling; // jsx_element
const _jsx$el14 = _jsx$el13.nextSibling; // jsx_element
const _jsx$el15 = _jsx$el14.nextSibling; // jsx_element
const _jsx$el16 = _jsx$el15.nextSibling; // jsx_self_closing_element
const _jsx$el17 = _jsx$el16.nextSibling; // jsx_element

_jsx$setAttribute(_jsx$el0, "class", `flex gap-2 h-full *:flex-none ${isSafari ? "*:w-max" : ""}`);
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
_jsx$addLocalEvent(_jsx$el3, "change", (ev) => updateFont("format", ev.currentTarget.value));
FixedFor.$$slots = {};
_jsx$insertChild(_jsx$el4, FixedFor({get each() { return formatList }, do: (f) => (
            (() => {
const _jsx$el0 = _jsx$templ3(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_expression

_jsx$setAttribute(_jsx$el0, "selected", f() === selectedFont().format);
_jsx$insertChild(_jsx$el1, () => f());

return _jsx$el0;
})()
          ), }));
_jsx$addLocalEvent(_jsx$el6, "click", () => updateFont("size", selectedFont().size - 1));
_jsx$trackAttribute(_jsx$el8, "value", () => selectedFont().size);
_jsx$addLocalEvent(_jsx$el8, "input", (ev) => updateFont("size", +ev.currentTarget.value));
_jsx$addLocalEvent(_jsx$el9, "click", () => updateFont("size", selectedFont().size + 1));
_jsx$setAttribute(_jsx$el11, "class", DIVIDER_STYLE);
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ11(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el12, Checkbox({get checked() { return selectedFont().bold }, onChange: (v) => updateFont("bold", v), }, Checkbox.$$slots));
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ13(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el13, Checkbox({get checked() { return selectedFont().italic }, onChange: (v) => updateFont("italic", v), }, Checkbox.$$slots));
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ15(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el14, Checkbox({get checked() { return selectedFont().underline }, onChange: (v) => updateFont("underline", v), }, Checkbox.$$slots));
Checkbox.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ17(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el15, Checkbox({get checked() { return selectedFont().strikethrough }, onChange: (v) => updateFont("strikethrough", v), }, Checkbox.$$slots));
_jsx$setAttribute(_jsx$el16, "class", DIVIDER_STYLE);
ColorPicker.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ20(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el17, ColorPicker({get color() { return selectedFont().color }, onChange: (v) => updateFont("format", v), }, ColorPicker.$$slots));

return _jsx$el0;
})()
  );
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function parseNumCell<T>(s: string, cb: (n: number) => T) {
  const n = Number(s);
  return Number.isNaN(n) ? s : cb(n);
}

export const formatMap = {
  Number: (s: string) =>
    parseNumCell(s, (n) => (n % 1 === 0 ? s : n.toFixed(2))),
  Currency: (s: string) => parseNumCell(s, (n) => currencyFormatter.format(n)),
  Date: (s: string) => {
    try {
      return new Date(s).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (_) {
      return s;
    }
  },
  Integer: (s: string) => parseNumCell(s, (n) => Math.floor(n)),
};

const formatList = Object.keys(formatMap);

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
  format: DEFAULT_FONT_FORMAT,
});
