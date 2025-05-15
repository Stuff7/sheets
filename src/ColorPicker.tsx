type ColorPickerProps = {
  color: string;
  defaultColor?: string;
  onChange: (color: string) => void;
};

export default function ColorPicker(props: ColorPickerProps) {
  return (
    <fieldset
      data-button
      class="compact relative flex items-center outline rounded-sm h-full"
    >
      <button
        data-icon
        class="plain py-1 px-2 rounded-sm"
        type="button"
        title="Clear"
        on:click={() => props.onChange(props.defaultColor ?? "")}
      >
        
      </button>
      <input
        type="color"
        $value={props.color}
        on:input={(ev) => props.onChange(ev.currentTarget.value)}
        class="w-7 h-full peer cursor-pointer opacity-0 rounded-sm"
      />
      <div class="w-7 h-full p-1 text-xs focus-sibling pointer-events-none absolute right-0 flex items-center justify-center rounded-sm flex-col">
        <slot />
        <div class="w-full h-3 outlined" style:background-color={props.color} />
      </div>
    </fieldset>
  );
}
