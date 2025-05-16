import { template as _jsx$template } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ1 = _jsx$template(`<pre><slot></slot></pre>`);

import Portal from "jsx/components/Portal";

export default function Dbg() {
  return (
    (() => {
Portal.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ1(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element

_jsx$insertChild(_jsx$el1, arguments[1]?.["default"]?.());

return _jsx$el0;
})()]}
const _jsx$el0 = Portal({to: "[data-dialog-id=dbg]", }, Portal.$$slots);

return _jsx$el0;
})()
  );
}
