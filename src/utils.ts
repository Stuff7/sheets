import { MAX_COLS } from "./config";
import type { Color, OffsetMap, Pos2D } from "./types";

export const [toAlphaUpper, fromAlphaUpper] = asciiNumParser(
  26,
  "A".charCodeAt(0),
);
export const [toAlphaLower, fromAlphaLower] = asciiNumParser(
  26,
  "a".charCodeAt(0),
);

export function getCellId(col: number, row: number) {
  return `${toAlphaUpper(col)}${toAlphaLower(row)}`;
}

export function getCellIdx(col: number, row: number) {
  return row * MAX_COLS + col;
}

export function totalOffsetsUntil(n: number, offsets: OffsetMap) {
  let sum = 0;
  for (const k in offsets) {
    if (+k <= n) sum += offsets[k];
  }
  return sum;
}

export function totalOffsetsRange(
  from: number,
  to: number,
  offsets: OffsetMap,
) {
  let sum = 0;
  for (const k in offsets) {
    const n = +k;
    if (n <= to && n >= from) sum += offsets[k];
  }
  return sum;
}

export function totalOffsets(offsets: OffsetMap) {
  return Object.values(offsets).reduce((cum, n) => cum + n, 0);
}

export const isTouchscreen = navigator.maxTouchPoints > 0;

export function aligned2(v: number, alignment: number): number {
  return (v + (alignment - 1)) & ~(alignment - 1);
}

export function aligned(v: number, alignment: number): number {
  return Math.floor(v / alignment) * alignment;
}

export function asciiNumParser(base: number, asciiStart: number) {
  return [
    (num: number) => {
      let n = num + 1;
      let result = "";
      while (n > 0) {
        const remainder = (n - 1) % base;
        result = String.fromCharCode(asciiStart + remainder) + result;
        n = Math.floor((n - 1) / base);
      }
      return result;
    },
    (s: string) => {
      let n = 0;
      for (let i = 0; i < s.length; i++) {
        n = n * base + (s.charCodeAt(i) - asciiStart + 1);
      }
      return n - 1;
    },
  ] as const;
}

export function getMousePosition(ev: MouseEvent | TouchEvent): Pos2D {
  let clientX: number;
  let clientY: number;

  if (ev instanceof MouseEvent) {
    clientX = ev.clientX;
    clientY = ev.clientY;
  } else if (ev instanceof TouchEvent && ev.touches.length > 0) {
    clientX = ev.touches[0].clientX;
    clientY = ev.touches[0].clientY;
  } else {
    return { x: -1, y: -1 };
  }

  return { x: clientX, y: clientY };
}

export function getRelativeMousePosition(ev: MouseEvent | TouchEvent) {
  const element = ev.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  const clientPos = getMousePosition(ev);

  if (clientPos.x === -1 && clientPos.y === -1) {
    return clientPos;
  }

  const x = clientPos.x - rect.left;
  const y = clientPos.y - rect.top;

  return { x, y };
}

export function hexToRgba(hexColor: string): Color {
  let hex = hexColor[0] === "#" ? hexColor.slice(1) : hexColor;

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }

  const r = Number.parseInt(hex.slice(0, 2), 16) / 256;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 256;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 256;
  const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;

  return [r, g, b, a];
}
