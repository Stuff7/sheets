import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { createTransition as _jsx$createTransition } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { trackCssProperty as _jsx$trackCssProperty } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ8 = _jsx$template(`<div class="flex flex-col gap-1 outlined rounded-sm overflow-hidden relative ml-auto transition-[translate] -translate-y-[calc(100%+30px)] duration-500 min-w-40 max-w-70 bg-zinc-100 dark:bg-zinc-900"><header><i><!></i><slot name="header"></slot><button data-icon type="button" class="compact plain pl-4 pr-3 text-xs ml-auto">x</button></header><article class="px-2 pb-4 overflow-auto max-h-40"><slot></slot></article><div class="absolute left-0 bottom-0 w-full h-1 bg-zinc-900/25 dark:bg-zinc-100/25"><div></div></div></div>`);

import { ref, watchFn } from "jsx";
import Portal from "jsx/components/Portal";

const levelColors = {
  info: "bg-indigo-500 text-zinc-100 dark:bg-emerald-500 dark:text-zinc-900",
  warn: "bg-yellow-500 text-zinc-900",
  error: "bg-rose-500 text-zinc-100",
};

const levelIcons = {
  info: "",
  warn: "",
  error: "",
};

type ToastProps = {
  open: boolean;
  onChange: (open: boolean) => void;
  level: keyof typeof levelColors;
};

const intervalStep = 10;
const duration = 3e3;

export default function Toast(props: ToastProps) {
  const [progress, setProgress] = ref(0);

  let timeout = -1;
  let interval = -1;
  let elapsed = 0;

  watchFn(
    () => props.open,
    () => {
      if (!props.open) return;

      setProgress(100);
      elapsed = 0;

      clearInterval(interval);
      interval = setInterval(() => {
        setProgress(100 - (elapsed / duration) * 100);
        elapsed += intervalStep;
        if (elapsed >= duration) clearInterval(interval);
      }, intervalStep);

      clearTimeout(timeout);
      timeout = setTimeout(close, duration);
    },
  );

  function close() {
    props.onChange(false);
    elapsed = 0;
    clearInterval(interval);
    clearTimeout(timeout);
  }

  return (
    (() => {
Portal.$$slots = {default: () => [(() => {

const _jsx$el0 = _jsx$createTransition(document.createComment(""), (() => {
const _jsx$el0 = _jsx$templ8(); // root[false]/component[true]/conditional[false]/transition[true]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_element
const _jsx$el3 = _jsx$el2.firstChild; // jsx_expression
const _jsx$el4 = _jsx$el2.nextSibling; // jsx_self_closing_element
const _jsx$el5 = _jsx$el4.nextSibling; // jsx_element
const _jsx$el6 = _jsx$el5.firstChild; // jsx_text
const _jsx$el7 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el8 = _jsx$el7.firstChild; // jsx_self_closing_element
const _jsx$el9 = _jsx$el7.nextSibling; // jsx_element
const _jsx$el10 = _jsx$el9.firstChild; // jsx_self_closing_element

_jsx$setAttribute(_jsx$el1, "class", `flex justify-end pl-3 gap-2 ${levelColors[props.level]}`);
_jsx$insertChild(_jsx$el3, () => levelIcons[props.level]);
_jsx$insertChild(_jsx$el4, arguments[1]?.["header"]?.());
_jsx$addLocalEvent(_jsx$el5, "click", close);
_jsx$insertChild(_jsx$el8, arguments[1]?.["default"]?.());
_jsx$setAttribute(_jsx$el10, "class", `h-full ${levelColors[props.level]}`);
_jsx$trackCssProperty(_jsx$el10, "width", () => `${progress()}%`);

return _jsx$el0;
}), () => props.open, "slide");

return _jsx$el0;
})()]}
const _jsx$el0 = Portal({to: "[data-toasts]", }, Portal.$$slots);

return _jsx$el0;
})()
  );
}
