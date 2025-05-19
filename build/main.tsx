import { insertChild as _jsx$insertChild } from "jsx";
import { template as _jsx$template } from "jsx";
import { addGlobalEvent as _jsx$addGlobalEvent } from "jsx";
import { createGlobalEvent as _jsx$createGlobalEvent } from "jsx";

const _jsx$templ2 = _jsx$template(`<div data-toasts class="absolute px-4 left-0 bottom-0 z-100 w-dvw h-0"></div>`);
const _jsx$templ1 = _jsx$template(`<div data-alerts class="absolute left-0 top-0 z-100 h-dvh w-dvw not-has-[[open=true]]:hidden bg-slate-950/50 backdrop-blur-xs"></div>`);
const _jsx$templ10 = _jsx$template(`<main class="grid grid-rows-[auto_1fr_auto] w-full h-full select-none"><!><!><article class="font-mono overflow-hidden max-w-dvw max-h-dvh grid grid-rows-[auto_minmax(0,1fr)] grid-cols-[max-content_minmax(0,1fr)]"><!><!><!></article><!></main>`);

window._jsx$global_event_keydown = window._jsx$global_event_keydown || _jsx$createGlobalEvent("keydown");
window._jsx$global_event_keyup = window._jsx$global_event_keyup || _jsx$createGlobalEvent("keyup");
import "./render";
import Canvas from "./Canvas";
import Dialog from "./Dialog";
import GridControls from "./GridControls";
import GridAxes from "./GridAxes";
import CellInput from "./CellInput";
import Tabs from "./Tabs";
import { setCtrlPressed, ctrlPressed, currentSheet } from "./state";
import { isTouchscreen } from "./utils";
import { serializeRegion } from "./region";
import { MAX_COLS, MAX_ROWS } from "./config";
import Header, { dbg, setDbg } from "./Header";

document.body.append(
  (() => {
Dialog.$$slots = {}
const _jsx$el0 = Dialog({class: "min-w-sm", title: "Debug", id: "dbg", get open() { return dbg() }, x: 100, y: 100, draggable: true, get onClose() { return setDbg }, });

return _jsx$el0;
})(),
  (() => {
const _jsx$el0 = _jsx$templ1(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]


return _jsx$el0;
})(),
  (() => {
const _jsx$el0 = _jsx$templ2(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]


return _jsx$el0;
})(),
);

function onKeyDown(ev: KeyboardEvent) {
  if (ev.key === "?") {
    setDbg(!dbg());
  } else if (ev.key === "Control" && !isTouchscreen) {
    setCtrlPressed(true);
  } else if (!isTouchscreen && ev.key.toLowerCase() === "a" && ctrlPressed()) {
    currentSheet().setLastSelectedRegions.byRef((sel) => {
      sel.clear();
      sel.add(
        serializeRegion({
          startCol: 0,
          startRow: 0,
          endCol: MAX_COLS,
          endRow: MAX_ROWS,
        }),
      );
    });
  }
}

function onKeyUp(ev: KeyboardEvent) {
  if (ev.key === "Control" && !isTouchscreen) {
    setCtrlPressed(false);
  }
}

document.body.prepend(
  (() => {
const _jsx$el0 = _jsx$templ10(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_self_closing_element
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_self_closing_element
const _jsx$el3 = _jsx$el2.nextSibling; // jsx_element
const _jsx$el4 = _jsx$el3.firstChild; // jsx_self_closing_element
const _jsx$el5 = _jsx$el4.nextSibling; // jsx_self_closing_element
const _jsx$el6 = _jsx$el5.nextSibling; // jsx_self_closing_element
const _jsx$el7 = _jsx$el3.nextSibling; // jsx_self_closing_element

_jsx$addGlobalEvent(window._jsx$global_event_keydown, _jsx$el0, onKeyDown);
_jsx$addGlobalEvent(window._jsx$global_event_keyup, _jsx$el0, onKeyUp);
Header.$$slots = {};
_jsx$insertChild(_jsx$el1, Header({}));
CellInput.$$slots = {};
_jsx$insertChild(_jsx$el2, CellInput({}));
GridAxes.$$slots = {};
_jsx$insertChild(_jsx$el4, GridAxes({}));
GridControls.$$slots = {};
_jsx$insertChild(_jsx$el5, GridControls({}));
Canvas.$$slots = {};
_jsx$insertChild(_jsx$el6, Canvas({}));
Tabs.$$slots = {};
_jsx$insertChild(_jsx$el7, Tabs({}));

return _jsx$el0;
})(),
);
