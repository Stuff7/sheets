import { ref } from "jsx";
import Grid from "./Grid";
import { DbgDialog } from "./Dbg";
import { prefersDark, setPrefersDark, canvasRect } from "./state";
import { touchSelection, setTouchSelection } from "./GridControls";
import { isTouchscreen } from "./utils";

const [dbg, setDbg] = ref(false);

document.body.append(
  <DbgDialog open={dbg()} x={100} y={100} draggable onClose={setDbg} />,
);

document.body.prepend(
  <main
    class="grid grid-rows-[auto_1fr] w-full h-full"
    g:onkeydown={(e) => e.key === "?" && setDbg(!dbg())}
  >
    <header class="grid grid-cols-[1fr_repeat(3,auto)] gap-2 w-full p-2 bg-stone-300 text-zinc-900 dark:bg-zinc-950 dark:text-stone-100">
      <h1 class="text-black text-xl text-inherit">Sheets</h1>
      <button
        $if={isTouchscreen}
        type="button"
        class="px-2 rounded-sm bg-indigo-500 hover:bg-indigo-700 text-zinc-50 dark:bg-emerald-500 dark:hover:bg-emerald-300 dark:text-zinc-900"
        on:click={() => setTouchSelection(!touchSelection())}
      >
        {touchSelection() ? "Selecting" : "Select"}
      </button>
      <span class:overflow-hidden>
        <em>
          Press{" "}
          <button
            type="button"
            class="font-bold text-lg"
            on:click={() => setDbg(!dbg())}
          >
            ?
          </button>{" "}
          for dbg info
        </em>{" "}
        | {canvasRect().width.toFixed(2)} {canvasRect().height.toFixed(2)}
      </span>
      <button
        type="button"
        class="min-w-4"
        on:click={() => setPrefersDark(!prefersDark())}
      >
        <i>{prefersDark() ? "" : ""}</i>
      </button>
    </header>
    <Grid />
  </main>,
);
