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
    <dialog
      $open={props.open}
      class:grid={props.open}
      class="grid-rows-[auto_1fr] absolute border-2 border-slate-900 dark:border-emerald-300 rounded-md whitespace-break-spaces max-w-3/4 max-h-3/4 left-0 top-0 z-100 bg-zinc-100/75 text-zinc-900 dark:bg-zinc-900/75 dark:text-zinc-100 font-mono"
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
        <h1 class="text-lg font-bold">{props.title}</h1>
        <button
          data-icon
          type="button"
          class:plain
          on:click={() => props.onClose(false)}
          on:touchend={() => props.onClose(false)}
        >
          
        </button>
      </header>
      <article
        data-dialog-id={props.id}
        class={`p-2 overflow-auto ${props.class}`}
      >
        <slot />
      </article>
    </dialog>
  );
}
