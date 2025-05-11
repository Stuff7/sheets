import FixedFor from "jsx/components/FixedFor";

type FontSizeInputProps = {
  value: number;
  onInput: (n: number) => void;
};

export default function FontSelector(props: FontSizeInputProps) {
  return (
    <fieldset class="flex gap-2 h-full">
      <select class="h-full">
        <FixedFor each={systemFonts} do={(f) => <option>{f()}</option>} />
      </select>
      <fieldset class="grid grid-cols-[1rem_3rem_1rem]">
        <button
          type="button"
          class:compact
          on:click={() => props.onInput(props.value - 1)}
        >
          -
        </button>
        <input
          class="text-center"
          $value={props.value}
          on:input={(ev) => props.onInput(+ev.currentTarget.value)}
        />
        <button
          type="button"
          class:compact
          on:click={() => props.onInput(props.value + 1)}
        >
          +
        </button>
      </fieldset>
    </fieldset>
  );
}

const systemFonts = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Tahoma",
  "Trebuchet MS",
  "Comic Sans MS",
  "Lucida Console",
  "Impact",
  "Segoe UI",
  "Arial Black",
  "Calibri",
  "Consolas",
  "Cambria",
  "Garamond",
  "Palatino Linotype",
  "Book Antiqua",
  "Century Gothic",
  "Lucida Sans",
  "MS Sans Serif",
  "MS Serif",
  "Tahoma",
  "Geneva",
  "Optima",
  "Helvetica Neue",
  "Futura",
  "Brush Script MT",
];
