export type Color = Tuple<number, 4>;

export type Pos2D = { x: number; y: number };

export type Quad = {
  text?: string;
  width: number;
  height: number;
} & Pos2D;

export type Cell = {
  col: number;
  row: number;
} & Pos2D;

export type CellMap = Record<number, Quad>;
export type PartialCellMap = Record<number, Partial<Quad>>;

export const MAX_COLS = 9e4;
export const MAX_ROWS = 2e5;

export const [toAlphaUpper] = asciiNumParser(26, "A".charCodeAt(0));
export const [toAlphaLower] = asciiNumParser(26, "a".charCodeAt(0));

export function getCellId(col: number, row: number) {
  return `${toAlphaUpper(col)}${toAlphaLower(row)}`;
}

export function getCellIdx(col: number, row: number) {
  return row * MAX_COLS + col;
}

export type Tuple<
  T,
  N extends number,
  R extends T[] = [],
> = R["length"] extends N ? R : Tuple<T, N, [...R, T]>;

export type KeysWithValue<T, V> = keyof {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

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
