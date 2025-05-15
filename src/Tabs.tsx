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
    <footer class="grid grid-cols-[auto_minmax(0,1fr)] bg-zinc-200 dark:bg-zinc-800 outlined">
      <button
        type="button"
        data-icon
        title="Add new sheet"
        class="plain dark:text-emerald-500 hover:dark:text-emerald-200 text-indigo-500 hover:text-indigo-700 h-full w-[56.5px] h-full"
        on:click={newSheet}
      >
        +
      </button>
      <nav
        role="tablist"
        class="relative flex gap-1 z-15 pr-3 pb-1 overflow-x-auto"
      >
        <For
          each={sheets()}
          do={(sheet, i) => (
            <span
              data-button
              class="compact grid grid-cols-[minmax(0,1fr)_auto] rounded-b-sm dark:bg-zinc-800 bg-zinc-100 flex min-w-24"
              class:selected={currentSheet() === sheet()}
            >
              <a
                role="tab"
                class="py-1 pl-2"
                $href={`#${encodeURIComponent(sheet().name())}`}
                on:dblclick={(ev) => {
                  setNameInput.byRef((input) => {
                    input.visible = true;
                    input.x = ev.currentTarget.offsetLeft;
                    input.y = ev.currentTarget.offsetTop;
                  });
                  nameInputEl.focus();
                }}
              >
                {sheet().name()}
              </a>
              <button
                data-icon
                type="button"
                class="plain px-2 h-full text-red-800 hover:text-red-600 dark:text-red-300 dark:hover:text-red-400"
                on:click={() => askDelete(i)}
                $disabled={sheets().length === 1}
              >
                
              </button>
            </span>
          )}
        />
        <input
          $ref={nameInputEl}
          class="absolute"
          class:hidden={!nameInput().visible}
          $value={currentSheet().name()}
          style:left={`${nameInput().x}px`}
          style:top={`${nameInput().y}px`}
          style:min-width={`${currentSheet().name().length + 1}ch`}
          style:width={`${nameInputLen()}ch`}
          pattern={`^${SHEET_NAME_PATTERN_STR}+$`}
          on:blur={hideNameInput}
          on:change={hideNameInput}
          on:input={(ev) => setNameInputLen(ev.currentTarget.value.length + 1)}
        />
      </nav>
      <Alert open={confirmationVisible()}>
        <p>
          Are you sure you want to delete{" "}
          <strong>{sheets()[deleteIdx()]?.name()}</strong>?
        </p>
        <menu class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="no-color rounded-sm text-zinc-100 bg-indigo-700 hover:bg-indigo-500 dark:text-zinc-900 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            on:click={confirmDelete}
          >
            <strong>YES</strong>
          </button>
          <button
            type="button"
            class="no-color rounded-sm text-zinc-100 bg-red-800 hover:bg-red-600 dark:text-zinc-900 dark:bg-red-500 dark:hover:bg-red-400"
            on:click={() => setConfirmationVisible(false)}
          >
            <strong>NO</strong>
          </button>
        </menu>
      </Alert>
      <Toast open={toastOpen()} onChange={setToastOpen} level="error">
        <strong slot="header">Invalid name!</strong>
        <p class="text-wrap text-center">
          You can only use letters, digits and underscores
        </p>
      </Toast>
      <Dbg>
        <p>ALERT: {confirmationVisible()}</p>
      </Dbg>
    </footer>
  );
}
