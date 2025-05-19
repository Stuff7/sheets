import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { template as _jsx$template } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";
import { trackClass as _jsx$trackClass } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { trackCssProperty as _jsx$trackCssProperty } from "jsx";
import { addGlobalEvent as _jsx$addGlobalEvent } from "jsx";
import { createGlobalEvent as _jsx$createGlobalEvent } from "jsx";

const _jsx$templ5 = _jsx$template(`<dialog class="grid-rows-[auto_1fr] absolute border-2 border-slate-900 dark:border-emerald-300 rounded-md whitespace-break-spaces max-w-3/4 max-h-3/4 left-0 top-0 z-100 bg-zinc-100/75 text-zinc-900 dark:bg-zinc-900/75 dark:text-zinc-100 font-mono"><header class="flex justify-between p-2 bg-slate-900 text-zinc-50 dark:bg-emerald-300 dark:text-zinc-900"><h1 class="text-lg font-bold"><!></h1><button data-icon type="button" class="plain"></button></header><article><slot></slot></article></dialog>`);

window._jsx$global_event_touchmove = window._jsx$global_event_touchmove || _jsx$createGlobalEvent("touchmove");
window._jsx$global_event_touchend = window._jsx$global_event_touchend || _jsx$createGlobalEvent("touchend");
window._jsx$global_event_mousemove = window._jsx$global_event_mousemove || _jsx$createGlobalEvent("mousemove");
window._jsx$global_event_mouseup = window._jsx$global_event_mouseup || _jsx$createGlobalEvent("mouseup");
import { reactive, ref } from "jsx";
import { getMousePosition } from "./utils";

type DialogProps = {
  open: boolean;
  id?: string;
  title?: string;
  onClose: (close: false) => void;
  draggable?: boolean;
  x: number;
  y: number;
  class?: string;
};

export default function Dialog(props: DialogProps) {
  const cursor = reactive({ x: props.x || 0, y: props.y || 0 });
  const cursorStart = reactive({ x: cursor.x, y: cursor.y });
  const cursorEnd = reactive({ x: cursor.x, y: cursor.y });
  const [dragging, setDragging] = ref(false);

  function startDrag(e: MouseEvent | TouchEvent) {
    if (!props.draggable) {
      return;
    }

    if (
      !(
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLInputElement
      )
    ) {
      e.preventDefault();
    }

    if (e instanceof MouseEvent && e.button !== 0) {
      return;
    }

    setDragging(true);

    const pos = getMousePosition(e);
    cursorStart.x = pos.x;
    cursorStart.y = pos.y;

    drag(e);
  }

  function drag(e: MouseEvent | TouchEvent) {
    if (!dragging()) {
      return;
    }

    const pos = getMousePosition(e);
    cursor.x = cursorEnd.x + pos.x - cursorStart.x;
    cursor.y = cursorEnd.y + pos.y - cursorStart.y;
  }

  function stopDrag() {
    setDragging(false);
    cursorEnd.x = cursor.x;
    cursorEnd.y = cursor.y;
  }

  return (
    (() => {
const _jsx$el0 = _jsx$templ5(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_element
const _jsx$el3 = _jsx$el2.firstChild; // jsx_expression
const _jsx$el4 = _jsx$el2.nextSibling; // jsx_element
const _jsx$el5 = _jsx$el4.firstChild; // jsx_text
const _jsx$el6 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el7 = _jsx$el6.firstChild; // jsx_self_closing_element

_jsx$trackAttribute(_jsx$el0, "open", () => props.open);
_jsx$trackClass(_jsx$el0, "grid", () => props.open);
_jsx$trackCssProperty(_jsx$el0, "left", () => `${cursor.x}px`);
_jsx$trackCssProperty(_jsx$el0, "top", () => `${cursor.y}px`);
_jsx$addGlobalEvent(window._jsx$global_event_touchmove, _jsx$el0, drag);
_jsx$addGlobalEvent(window._jsx$global_event_touchend, _jsx$el0, stopDrag);
_jsx$addGlobalEvent(window._jsx$global_event_mousemove, _jsx$el0, drag);
_jsx$addGlobalEvent(window._jsx$global_event_mouseup, _jsx$el0, stopDrag);
_jsx$trackClass(_jsx$el1, "cursor-grab", () => !dragging());
_jsx$trackClass(_jsx$el1, "cursor-grabbing", () => dragging());
_jsx$addLocalEvent(_jsx$el1, "mousedown", startDrag);
_jsx$addLocalEvent(_jsx$el1, "touchstart", startDrag);
_jsx$insertChild(_jsx$el3, () => props.title);
_jsx$addLocalEvent(_jsx$el4, "click", () => props.onClose(false));
_jsx$addLocalEvent(_jsx$el4, "touchend", () => props.onClose(false));
_jsx$setAttribute(_jsx$el6, "data-dialog-id", props.id);
_jsx$setAttribute(_jsx$el6, "class", `p-2 overflow-auto ${props.class}`);
_jsx$insertChild(_jsx$el7, arguments[1]?.["default"]?.());

return _jsx$el0;
})()
  );
}
