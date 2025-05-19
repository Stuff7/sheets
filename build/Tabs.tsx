import { addLocalEvent as _jsx$addLocalEvent } from "jsx";
import { trackClass as _jsx$trackClass } from "jsx";
import { trackAttribute as _jsx$trackAttribute } from "jsx";
import { setAttribute as _jsx$setAttribute } from "jsx";
import { template as _jsx$template } from "jsx";
import { trackCssProperty as _jsx$trackCssProperty } from "jsx";
import { insertChild as _jsx$insertChild } from "jsx";

const _jsx$templ16 = _jsx$template(`<p class="text-wrap text-center">You can only use letters, digits and underscores</p>`);
const _jsx$templ8 = _jsx$template(`<p>Are you sure you want to delete<!><strong><!></strong>?</p>`);
const _jsx$templ18 = _jsx$template(`<p>ALERT: <!></p>`);
const _jsx$templ20 = _jsx$template(`<footer class="grid grid-cols-[auto_minmax(0,1fr)] bg-zinc-200 dark:bg-zinc-800 outlined"><button type="button" data-icon title="Add new sheet" class="plain dark:text-emerald-500 hover:dark:text-emerald-200 text-indigo-500 hover:text-indigo-700 h-full w-[56.5px] h-full">+</button><nav role="tablist" class="relative flex gap-1 z-15 pr-3 pb-1 overflow-x-auto"><!><input class="absolute"/></nav><!><!><!></footer>`);
const _jsx$templ13 = _jsx$template(`<menu class="grid grid-cols-2 gap-2"><button type="button" class="no-color rounded-sm text-zinc-100 bg-indigo-700 hover:bg-indigo-500 dark:text-zinc-900 dark:bg-emerald-500 dark:hover:bg-emerald-400"><strong>YES</strong></button><button type="button" class="no-color rounded-sm text-zinc-100 bg-red-800 hover:bg-red-600 dark:text-zinc-900 dark:bg-red-500 dark:hover:bg-red-400"><strong>NO</strong></button></menu>`);
const _jsx$templ3 = _jsx$template(`<span data-button class="compact grid grid-cols-[minmax(0,1fr)_auto] rounded-b-sm dark:bg-zinc-800 bg-zinc-100 flex min-w-24"><a role="tab" class="py-1 pl-2"><!></a><button data-icon type="button" class="plain px-2 h-full text-red-800 hover:text-red-600 dark:text-red-300 dark:hover:text-red-400"></button></span>`);
const _jsx$templ15 = _jsx$template(`<strong>Invalid name!</strong>`);

import { ref } from "jsx";
import For from "jsx/components/For";
import {
  addSheet,
  currentSheet,
  delSheet,
  setCurrentSheet,
  sheets,
} from "./state";
import Alert from "./Alert";
import Dbg from "./Dbg";
import { SHEET_NAME_PATTERN_STR } from "./config";
import Toast from "./Toast";

export default function Tabs() {
  let nameInputEl!: HTMLInputElement;
  const [nameInput, setNameInput] = ref({ visible: false, x: 0, y: 0 });
  const [nameInputLen, setNameInputLen] = ref(currentSheet().name().length + 1);
  const [deleteIdx, setDeleteIdx] = ref(0);
  const [confirmationVisible, setConfirmationVisible] = ref(false);
  const [toastOpen, setToastOpen] = ref(false);

  function hideNameInput() {
    if (!nameInputEl.checkValidity()) return setToastOpen(true);

    setNameInput.byRef((input) => {
      input.visible = false;
    });

    if (nameInputEl.value && nameInputEl.value !== currentSheet().name()) {
      currentSheet().setName(nameInputEl.value);
    }
  }

  function askDelete(idx: number) {
    setDeleteIdx(idx);
    setConfirmationVisible(true);
  }

  function confirmDelete() {
    setConfirmationVisible(false);
    delSheet(deleteIdx());
  }

  function newSheet() {
    addSheet();
  }

  window.addEventListener("hashchange", () => {
    const name = decodeURIComponent(location.hash).slice(1);
    const sheet = sheets().find((s) => s.name() === name);
    if (sheet) setCurrentSheet(sheet);
  });

  return (
    (() => {
const _jsx$el0 = _jsx$templ20(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_text
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el4 = _jsx$el3.firstChild; // jsx_self_closing_element
const _jsx$el5 = _jsx$el4.nextSibling; // jsx_self_closing_element
const _jsx$el6 = _jsx$el3.nextSibling; // jsx_element
const _jsx$el7 = _jsx$el6.nextSibling; // jsx_element
const _jsx$el8 = _jsx$el7.nextSibling; // jsx_element

_jsx$addLocalEvent(_jsx$el1, "click", newSheet);
For.$$slots = {};
_jsx$insertChild(_jsx$el4, For({get each() { return sheets() }, do: (sheet, i) => (
            (() => {
const _jsx$el0 = _jsx$templ3(); // root[true]/component[false]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_expression
const _jsx$el3 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el4 = _jsx$el3.firstChild; // jsx_text

_jsx$trackClass(_jsx$el0, "selected", () => currentSheet() === sheet());
_jsx$trackAttribute(_jsx$el1, "href", () => `#${encodeURIComponent(sheet().name())}`);
_jsx$addLocalEvent(_jsx$el1, "dblclick", (ev) => {
                  setNameInput.byRef((input) => {
                    input.visible = true;
                    input.x = ev.currentTarget.offsetLeft;
                    input.y = ev.currentTarget.offsetTop;
                  });
                  nameInputEl.focus();
                });
_jsx$insertChild(_jsx$el2, () => sheet().name());
_jsx$addLocalEvent(_jsx$el3, "click", () => askDelete(i));
_jsx$trackAttribute(_jsx$el3, "disabled", () => sheets().length === 1);

return _jsx$el0;
})()
          ), }));
nameInputEl = _jsx$el5;
_jsx$trackClass(_jsx$el5, "hidden", () => !nameInput().visible);
_jsx$trackAttribute(_jsx$el5, "value", () => currentSheet().name());
_jsx$trackCssProperty(_jsx$el5, "left", () => `${nameInput().x}px`);
_jsx$trackCssProperty(_jsx$el5, "top", () => `${nameInput().y}px`);
_jsx$trackCssProperty(_jsx$el5, "min-width", () => `${currentSheet().name().length + 1}ch`);
_jsx$trackCssProperty(_jsx$el5, "width", () => `${nameInputLen()}ch`);
_jsx$setAttribute(_jsx$el5, "pattern", `^${SHEET_NAME_PATTERN_STR}+$`);
_jsx$addLocalEvent(_jsx$el5, "blur", hideNameInput);
_jsx$addLocalEvent(_jsx$el5, "change", hideNameInput);
_jsx$addLocalEvent(_jsx$el5, "input", (ev) => setNameInputLen(ev.currentTarget.value.length + 1));
Alert.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ8(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression
const _jsx$el3 = _jsx$el2.nextSibling; // jsx_element
const _jsx$el4 = _jsx$el3.firstChild; // jsx_expression
const _jsx$el5 = _jsx$el3.nextSibling; // jsx_text

_jsx$insertChild(_jsx$el2, " ");
_jsx$insertChild(_jsx$el4, () => sheets()[deleteIdx()]?.name());

return _jsx$el0;
})(),(() => {
const _jsx$el0 = _jsx$templ13(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_element
const _jsx$el2 = _jsx$el1.firstChild; // jsx_element
const _jsx$el3 = _jsx$el2.firstChild; // jsx_text
const _jsx$el4 = _jsx$el1.nextSibling; // jsx_element
const _jsx$el5 = _jsx$el4.firstChild; // jsx_element
const _jsx$el6 = _jsx$el5.firstChild; // jsx_text

_jsx$addLocalEvent(_jsx$el1, "click", confirmDelete);
_jsx$addLocalEvent(_jsx$el4, "click", () => setConfirmationVisible(false));

return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el6, Alert({get open() { return confirmationVisible() }, }, Alert.$$slots));
Toast.$$slots = {header: (() => {
const _jsx$el0 = _jsx$templ15(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
}), default: () => [(() => {
const _jsx$el0 = _jsx$templ16(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text


return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el7, Toast({get open() { return toastOpen() }, get onChange() { return setToastOpen }, level: "error", }, Toast.$$slots));
Dbg.$$slots = {default: () => [(() => {
const _jsx$el0 = _jsx$templ18(); // root[false]/component[true]/conditional[false]/transition[false]/template-child[false]
const _jsx$el1 = _jsx$el0.firstChild; // jsx_text
const _jsx$el2 = _jsx$el1.nextSibling; // jsx_expression

_jsx$insertChild(_jsx$el2, () => confirmationVisible());

return _jsx$el0;
})()]};
_jsx$insertChild(_jsx$el8, Dbg({}, Dbg.$$slots));

return _jsx$el0;
})()
  );
}
