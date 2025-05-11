import Portal from "jsx/components/Portal";

type AlertProps = {
  open: boolean;
};

export default function Alert(props: AlertProps) {
  return (
    <Portal to="[data-alerts]">
      <dialog
        $open={props.open}
        class="outlined absolute left-1/2 top-1/2 -translate-1/2 grid grid-auto-row gap-2 justify-center items-center px-8 py-4 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 rounded-md"
      >
        <slot />
      </dialog>
    </Portal>
  );
}
