type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Checkbox(props: CheckboxProps) {
  return (
    <label
      data-button
      class="relative focus-children has-checked:bg-indigo-500! has-checked:hover:bg-indigo-700! has-checked:text-zinc-100! dark:has-checked:bg-emerald-500! dark:has-checked:text-zinc-900! dark:has-checked:hover:bg-emerald-200! rounded-square"
    >
      <input
        type="checkbox"
        class="opacity-0 absolute pointer-events-none"
        checked={props.checked}
        on:change={(ev) => props.onChange(ev.currentTarget.checked)}
      />
      <slot />
    </label>
  );
}
