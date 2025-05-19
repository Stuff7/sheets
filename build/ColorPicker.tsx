import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { trackCssProperty as _jsx$trackCssProperty } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ5 = _jsx$template(`<fieldset data-button class="compact relative flex items-center outline rounded-sm h-full"><button data-icon class="plain py-1 px-2 rounded-sm" type="button" title="Clear"></button><input type="color" class="w-7 h-full peer cursor-pointer opacity-0 rounded-sm"/><div class="w-7 h-full p-1 text-xs focus-sibling pointer-events-none absolute right-0 flex items-center justify-center rounded-sm flex-col"><slot></slot><div class="w-full h-3 outlined"></div></div></fieldset>`);

type ColorPickerProps = {
  color: string;
  defaultColor?: string;
  onChange: (color: string) => void;
};

export default function ColorPicker(props: ColorPickerProps) {
  return (
    (() => {
const _jsx$el0 = _jsx$templ5(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_text
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_self_closing_element
const _jsx$el4 = _jsx$el3.nextSibling; // jsx_element
const _jsx$el5 = _jsx$el4.firstChild; // jsx_self_closing_element
const _jsx$el6 = _jsx$el5.nextSibling; // jsx_self_closing_element

_jsx$addLocalEvent(_jsx$el1, "click", () => props.onChange(props.defaultColor ?? ""));
_jsx$trackAttribute(_jsx$el3, "value", () => props.color);
_jsx$addLocalEvent(_jsx$el3, "input", (ev) => props.onChange(ev.currentTarget.value));
_jsx$insertChild(_jsx$el5, arguments[1]?.["default"]?.());
_jsx$trackCssProperty(_jsx$el6, "background-color", () => props.color);

return _jsx$el0;
})()
  );
}
