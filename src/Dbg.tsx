import { reactive, ref } from "jsx";
import { getMousePosition } from "./utils";

type DbgProps = {
  open: boolean;
  title?: string;
  onclose: (close: false) => void;
  draggable?: boolean;
  x: number;
  y: number;
};

export default function Dbg(props: DbgProps) {
  // biome-ignore lint/suspicious/noConfusingLabels:
  // biome-ignore lint/correctness/noUnusedLabels:
  DEV: {
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
      <pre
        class="absolute border-2 border-slate-900 dark:border-emerald-300 rounded-md whitespace-break-spaces max-w-3/4 max-h-3/4 left-0 top-0 z-100 bg-zinc-100/75 text-zinc-900 dark:bg-zinc-900/75 dark:text-zinc-100 font-mono overflow-auto"
        class:hidden={!props.open}
        style:left={`${cursor.x}px`}
        style:top={`${cursor.y}px`}
        g:ontouchmove={drag}
        g:ontouchend={stopDrag}
        g:onmousemove={drag}
        g:onmouseup={stopDrag}
      >
        <header
          class="flex justify-between p-2 bg-slate-900 text-zinc-50 dark:bg-emerald-300 dark:text-zinc-900"
          class:cursor-grab={!dragging()}
          class:cursor-grabbing={dragging()}
          on:mousedown={startDrag}
          on:touchstart={startDrag}
        >
          <h1 class="text-lg font-bold">{props.title ?? "Dbg"}</h1>
          <button
            type="button"
            class="hover:scale-150 transition-transform"
            on:click={() => props.onclose(false)}
          >
            <i></i>
          </button>
        </header>
        <article class:p-2>
          <slot />
        </article>
      </pre>
    );
  }
}
