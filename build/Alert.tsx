import { trackClass as _jsx$trackClass } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ1 = _jsx$template(`<dialog class="outlined absolute h-auto left-1/2 top-1/2 -translate-1/2 grid-auto-row gap-2 justify-center items-center px-8 py-4 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 rounded-md"><slot></slot></dialog>`);

import Portal from "jsx/components/Portal";

type AlertProps = {
  open: boolean;
};

export default function Alert(props: AlertProps) {
  return (
    (() => {
Portal.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ1(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element

_jsx$trackAttribute(_jsx$el0, "open", () => props.open);
_jsx$trackClass(_jsx$el0, "grid", () => props.open);
_jsx$insertChild(_jsx$el1, arguments[1]?.["default"]?.());

return _jsx$el0;
})()]}
const _jsx$el0 = Portal({to: "[data-alerts]", }, Portal.$$slots);

return _jsx$el0;
})()
  );
}
