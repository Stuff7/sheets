import { ref, watchFn } from "jsx";
import Portal from "jsx/components/Portal";

const levelColors = {
  info: "bg-indigo-500 text-zinc-100 dark:bg-emerald-500 dark:text-zinc-900",
  warn: "bg-yellow-500 text-zinc-900",
  error: "bg-rose-500 text-zinc-100",
};

const levelIcons = {
  info: "",
  warn: "",
  error: "",
};

type ToastProps = {
  open: boolean;
  onChange: (open: boolean) => void;
  level: keyof typeof levelColors;
};

const intervalStep = 10;
const duration = 3e3;

export default function Toast(props: ToastProps) {
  const [progress, setProgress] = ref(0);

  let timeout = -1;
  let interval = -1;
  let elapsed = 0;

  watchFn(
    () => props.open,
    () => {
      if (!props.open) return;

      setProgress(100);
      elapsed = 0;

      clearInterval(interval);
      interval = setInterval(() => {
        setProgress(100 - (elapsed / duration) * 100);
        elapsed += intervalStep;
        if (elapsed >= duration) clearInterval(interval);
      }, intervalStep);

      clearTimeout(timeout);
      timeout = setTimeout(close, duration);
    },
  );

  function close() {
    props.onChange(false);
    elapsed = 0;
    clearInterval(interval);
    clearTimeout(timeout);
  }

  return (
    <Portal to="[data-toasts]">
      <div
        class="flex flex-col gap-1 outlined rounded-sm overflow-hidden relative ml-auto transition-[translate] -translate-y-[calc(100%+30px)] duration-500 min-w-40 max-w-70 bg-zinc-100 dark:bg-zinc-900"
        $transition:slide={props.open}
      >
        <header
          class={`flex justify-end pl-3 gap-2 ${levelColors[props.level]}`}
        >
          <i>{levelIcons[props.level]}</i>
          <slot name="header" />
          <button
            data-icon
            type="button"
            class="compact plain pl-4 pr-3 text-xs ml-auto"
            on:click={close}
          >
            x
          </button>
        </header>
        <article class="px-2 pb-4 overflow-auto max-h-40">
          <slot />
        </article>
        <div class="absolute left-0 bottom-0 w-full h-1 bg-zinc-900/25 dark:bg-zinc-100/25">
          <div
            class={`h-full ${levelColors[props.level]}`}
            style:width={`${progress()}%`}
          />
        </div>
      </div>
    </Portal>
  );
}
