import Canvas from "./Canvas";
import {
  prefersDark,
  setPrefersDark,
  canvasWidth,
  canvasHeight,
} from "./state";

document.body.append(
  <main class="grid grid-rows-[auto_1fr] w-full h-full">
    <header class="grid grid-cols-[1fr_auto_auto] gap-2 w-full p-2 bg-stone-300 text-zinc-900 dark:bg-zinc-950 dark:text-stone-100">
      <h1 class="text-black text-xl text-inherit">Sheets</h1>
      <button type="button" on:click={() => setPrefersDark(!prefersDark())}>
        <i>{prefersDark() ? "" : ""}</i>
      </button>
      <span class:overflow-hidden>
        <em>
          Press <strong>?</strong> for dbg info
        </em>{" "}
        | {canvasWidth()} {canvasHeight()}
      </span>
    </header>
    <Canvas />
  </main>,
);
