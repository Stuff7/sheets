import Portal from "jsx/components/Portal";

export default function Dbg() {
  return (
    <Portal to="[data-dialog-id=dbg]">
      <pre>
        <slot />
      </pre>
    </Portal>
  );
}
