import Portal from "jsx/components/Portal";

export default function Dbg() {
  // biome-ignore lint/suspicious/noConfusingLabels:
  // biome-ignore lint/correctness/noUnusedLabels:
  DEV: {
    return (
      <Portal to="[data-dialog-id=dbg]">
        <pre>
          <slot />
        </pre>
      </Portal>
    );
  }
}
