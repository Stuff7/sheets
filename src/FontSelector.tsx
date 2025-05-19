import { ref } from "jsx";
import FixedFor from "jsx/components/FixedFor";
import { currentSheet, forEachSelectedTextCell } from "./state";
import {
  DEFAULT_BOLD,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_FORMAT,
  DEFAULT_FONT_SIZE,
  DEFAULT_ITALIC,
  DEFAULT_STRIKETHROUGH,
  DEFAULT_UNDERLINE,
  DIVIDER_STYLE,
} from "./config";
import type { FontStyle } from "./types";
import ColorPicker from "./ColorPicker";
import Checkbox from "./Checkbox";
import { isSafari } from "./utils";

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
    <fieldset
      class={`flex gap-2 h-full *:flex-none ${isSafari ? "*:w-max" : ""}`}
    >
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
      <select
        class="h-full"
        on:change={(ev) => updateFont("format", ev.currentTarget.value)}
      >
        <FixedFor
          each={formatList}
          do={(f) => (
            <option selected={f() === selectedFont().format}>{f()}</option>
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
        onChange={(v) => updateFont("format", v)}
      >
        <strong>Aa</strong>
      </ColorPicker>
    </fieldset>
  );
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function parseNumCell<T>(s: string, cb: (n: number) => T) {
  const n = Number(s);
  return Number.isNaN(n) ? s : cb(n);
}

export const formatMap = {
  Number: (s: string) =>
    parseNumCell(s, (n) => (n % 1 === 0 ? s : n.toFixed(2))),
  Currency: (s: string) => parseNumCell(s, (n) => currencyFormatter.format(n)),
  Date: (s: string) => {
    try {
      return new Date(s).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (_) {
      return s;
    }
  },
  Integer: (s: string) => parseNumCell(s, (n) => Math.floor(n)),
};

const formatList = Object.keys(formatMap);

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
  format: DEFAULT_FONT_FORMAT,
});
