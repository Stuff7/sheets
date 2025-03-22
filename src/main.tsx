import { ref, watch } from "jsx";
import Canvas from "./Canvas";

const [prefersDark, setPrefersDark] = ref(
  matchMedia("(prefers-color-scheme: dark)").matches,
);
const [contentWidth, setContentWidth] = ref(0);
const [contentHeight, setContentHeight] = ref(0);

let content!: HTMLElement;

queueMicrotask(() => {
  const observer = new ResizeObserver(([e]) => {
    const w = e.borderBoxSize[0].inlineSize;
    const h = e.borderBoxSize[0].blockSize;
    if (contentWidth() !== w) setContentWidth(w);
    if (contentHeight() !== h) setContentHeight(h);
  });

  observer.observe(content);
});

watch(() => {
  document.documentElement.classList[prefersDark() ? "add" : "remove"]("dark");
});

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
        | {contentWidth()} {contentHeight()}
      </span>
    </header>
    <article $ref={content} class:overflow-hidden>
      <Canvas width={contentWidth()} height={contentHeight()} />
    </article>
  </main>,
);
