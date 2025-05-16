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
  <div data-toasts class="absolute px-4 left-0 bottom-0 z-100 w-dvw h-0" />,
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
  <main
    class="grid grid-rows-[auto_1fr_auto] w-full h-full select-none"
    g:onkeydown={onKeyDown}
    g:onkeyup={onKeyUp}
  >
    <Header />
    <CellInput />
    <article class="font-mono overflow-hidden max-w-dvw max-h-dvh grid grid-rows-[auto_minmax(0,1fr)] grid-cols-[max-content_minmax(0,1fr)]">
      <GridAxes />
      <GridControls />
      <Canvas />
    </article>
    <Tabs />
  </main>,
);
