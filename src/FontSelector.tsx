import { ref } from "jsx";
import FixedFor from "jsx/components/FixedFor";
import { currentSheet, forEachSelectedTextCell } from "./state";
import {
  DEFAULT_BOLD,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_ITALIC,
  DEFAULT_STRIKETHROUGH,
  DEFAULT_UNDERLINE,
  DIVIDER_STYLE,
} from "./config";
import type { FontStyle } from "./types";
import ColorPicker from "./ColorPicker";
import Checkbox from "./Checkbox";

export default function FontSelector() {
  function updateFont<K extends keyof FontStyle>(k: K, v: FontStyle[K]) {
    setSelectedFont.byRef((f) => {
      f[k] = v;
    });
    currentSheet().setTextCells.byRef((textCells) => {
      forEachSelectedTextCell(textCells, (tc) => {
        tc.style[k] = v;
      });
    });
  }

  return (
    <fieldset class="flex gap-2 h-full">
      <select
        class="h-full"
        on:change={(ev) => updateFont("family", ev.currentTarget.value)}
      >
        <FixedFor
          each={fontList}
          do={(f) => (
            <option selected={f() === selectedFont().family}>{f()}</option>
          )}
        />
      </select>
      <fieldset class="grid grid-cols-[1rem_3rem_1rem]">
        <button
          type="button"
          class:compact
          on:click={() => updateFont("size", selectedFont().size - 1)}
        >
          -
        </button>
        <input
          class="text-center"
          $value={selectedFont().size}
          on:input={(ev) => updateFont("size", +ev.currentTarget.value)}
        />
        <button
          type="button"
          class:compact
          on:click={() => updateFont("size", selectedFont().size + 1)}
        >
          +
        </button>
      </fieldset>
      <div class={DIVIDER_STYLE} />
      <Checkbox
        checked={selectedFont().bold}
        onChange={(v) => updateFont("bold", v)}
      >
        <strong>B</strong>
      </Checkbox>
      <Checkbox
        checked={selectedFont().italic}
        onChange={(v) => updateFont("italic", v)}
      >
        <em>I</em>
      </Checkbox>
      <Checkbox
        checked={selectedFont().underline}
        onChange={(v) => updateFont("underline", v)}
      >
        <u>U</u>
      </Checkbox>
      <Checkbox
        checked={selectedFont().strikethrough}
        onChange={(v) => updateFont("strikethrough", v)}
      >
        <s>S</s>
      </Checkbox>
      <div class={DIVIDER_STYLE} />
      <ColorPicker
        color={selectedFont().color}
        onChange={(v) => updateFont("color", v)}
      >
        <strong>Aa</strong>
      </ColorPicker>
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

export const [selectedFont, setSelectedFont] = ref<FontStyle>({
  family: DEFAULT_FONT_FAMILY,
  size: DEFAULT_FONT_SIZE,
  color: DEFAULT_FONT_COLOR,
  bold: DEFAULT_BOLD,
  italic: DEFAULT_ITALIC,
  underline: DEFAULT_UNDERLINE,
  strikethrough: DEFAULT_STRIKETHROUGH,
});
