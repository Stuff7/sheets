import { ref } from "jsx";
import FixedFor from "jsx/components/FixedFor";

export default function FontSelector() {
  return (
    <fieldset class="flex gap-2 h-full">
      <select
        class="h-full"
        on:change={(ev) => setSelectedFont(ev.currentTarget.value)}
      >
        <FixedFor each={fontList} do={(f) => <option>{f()}</option>} />
      </select>
      <fieldset class="grid grid-cols-[1rem_3rem_1rem]">
        <button
          type="button"
          class:compact
          on:click={() => setSelectedFontSize(selectedFontSize() - 1)}
        >
          -
        </button>
        <input
          class="text-center"
          $value={selectedFontSize()}
          on:input={(ev) => setSelectedFontSize(+ev.currentTarget.value)}
        />
        <button
          type="button"
          class:compact
          on:click={() => setSelectedFontSize(selectedFontSize() + 1)}
        >
          +
        </button>
      </fieldset>
    </fieldset>
  );
}

const fontList = [
  "Amatic SC",
  "Caveat",
  "Comfortaa",
  "Courier Prime",
  "EB Garamond",
  "Exo",
  "JetBrainsMono",
  "Lexend",
  "Lobster",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Nunito",
  "Oswald",
  "Pacifico",
  "Playfair Display",
  "Roboto",
  "Roboto Mono",
  "Roboto Serif",
  "Spectral",
];

export const [selectedFont, setSelectedFont] = ref(fontList[0]);
export const [selectedFontSize, setSelectedFontSize] = ref(16);
