import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ2 = _jsx$template(`<label data-button class="relative focus-children has-checked:bg-indigo-500! has-checked:hover:bg-indigo-700! has-checked:text-zinc-100! dark:has-checked:bg-emerald-500! dark:has-checked:text-zinc-900! dark:has-checked:hover:bg-emerald-200! rounded-square"><input type="checkbox" class="opacity-0 absolute pointer-events-none"/><slot></slot></label>`);

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Checkbox(props: CheckboxProps) {
  return (
    (() => {
const _jsx$el0 = _jsx$templ2(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_self_closing_element

_jsx$setAttribute(_jsx$el1, "checked", props.checked);
_jsx$addLocalEvent(_jsx$el1, "change", (ev) => props.onChange(ev.currentTarget.checked));
_jsx$insertChild(_jsx$el2, arguments[1]?.["default"]?.());

return _jsx$el0;
})()
  );
}
