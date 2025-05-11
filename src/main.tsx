import { ref } from "jsx";
import Canvas from "./Canvas";
import Dialog from "./Dialog";
import {
  prefersDark,
  setPrefersDark,
  setTouchSelection,
  touchSelection,
  setCtrlPressed,
  ctrlPressed,
  currentSheet,
} from "./state";
import GridControls from "./GridControls";
import { isTouchscreen } from "./utils";
import GridAxes from "./GridAxes";
import { serializeRegion } from "./region";
import { MAX_COLS, MAX_ROWS } from "./config";
import CellColorPicker from "./CellColorPicker";
import FontSelector from "./FontSelector";
import { decodeXLSXData, encodeXLSXData, formatSheetData } from "./saves";
import Tabs from "./Tabs";

const [dbg, setDbg] = ref(false);

document.body.append(
  <Dialog
    class="min-w-sm"
    title="Debug"
    id="dbg"
    open={dbg()}
    x={100}
    y={100}
    draggable
    onClose={setDbg}
  />,
  <div
    data-alerts
    class="absolute left-0 top-0 z-100 h-dvh w-dvw not-has-[[open=true]]:hidden bg-slate-950/50 backdrop-blur-xs"
  />,
);

function onKeyDown(ev: KeyboardEvent) {
  if (ev.key === "?") {
    setDbg(!dbg());
  } else if (ev.key === "Control" && !isTouchscreen) {
    setCtrlPressed(true);
  } else if (ev.key.toLowerCase() === "a" && ctrlPressed()) {
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

const [fontSize, setFontSize] = ref(16);

document.body.prepend(
  <main
    class="grid grid-rows-[auto_1fr_auto] w-full h-full select-none"
    g:onkeydown={onKeyDown}
    g:onkeyup={onKeyUp}
  >
    <header class="flex items-center gap-2 w-full p-2 bg-stone-300 text-zinc-900 dark:bg-zinc-950 dark:text-stone-100">
      <h1 class="flex-1 text-black text-xl text-inherit font-bold px-3">
        <i></i> Sheets
      </h1>
      <button
        $if={isTouchscreen}
        type="button"
        class="px-2 h-full rounded-sm bg-indigo-500 hover:bg-indigo-700 text-zinc-50 dark:bg-emerald-500 dark:hover:bg-emerald-300 dark:text-zinc-900"
        on:click={() => setTouchSelection(!touchSelection())}
      >
        {touchSelection() ? "Selecting" : "Select"}
      </button>
      <FontSelector value={fontSize()} onInput={setFontSize} />
      <CellColorPicker />
      <button
        type="button"
        class="px-2 rounded-sm"
        on:click={() => {
          const encoded = encodeXLSXData(formatSheetData());
          console.log("Encoded", encoded);
          console.log("Decoded", decodeXLSXData(encoded));
        }}
      >
        SAVE
      </button>
      <button
        type="button"
        class="px-2 rounded-sm font-bold h-full aspect-square"
        class:selected={dbg()}
        title="Debug Info"
        on:click={() => setDbg(!dbg())}
      >
        ?
      </button>
      <button
        type="button"
        class="min-w-4 px-2 rounded-sm h-full aspect-square"
        on:click={() => setPrefersDark(!prefersDark())}
      >
        <i>{prefersDark() ? "" : ""}</i>
      </button>
    </header>
    <article class="font-mono overflow-hidden max-w-dvw max-h-dvh grid grid-rows-[auto_minmax(0,1fr)] grid-cols-[max-content_minmax(0,1fr)]">
      <GridAxes />
      <GridControls />
      <Canvas />
    </article>
    <Tabs />
  </main>,
);
