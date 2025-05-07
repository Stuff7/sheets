export type Tuple<
  T,
  N extends number,
  R extends T[] = [],
> = R["length"] extends N ? R : Tuple<T, N, [...R, T]>;

export type KeysWithValue<T, V> = keyof {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

export type JsxEv<Ev extends Event, El extends Element> = Ev & {
  currentTarget: El;
};

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

export type TextMap = Record<number, string>;
export type CellMap = Record<number, Quad>;
export type PartialCellMap = Record<number, Partial<Quad>>;
export type OffsetMap = Record<number, number>;
export type RegionMap = Record<string, Set<string>>;

export type PartialCell = {
  index: number;
  remainder: number;
};
