import { watch, ref } from "jsx";
import { CELL_H, CELL_W } from "./utils";

export const [canvasRect, setCanvasRect] = ref(new DOMRect());

export const [prefersDark, setPrefersDark] = ref(
  matchMedia("(prefers-color-scheme: dark)").matches,
);

watch(() => {
  document.documentElement.classList[prefersDark() ? "add" : "remove"]("dark");
});

export const [colOffsets, setColOffsets] = ref<Record<number, number>>({});
export const [rowOffsets, setRowOffsets] = ref<Record<number, number>>({});

export function getEffectiveCellWidth(index: number): number {
  return CELL_W + (colOffsets()[index] ?? 0);
}

export function getEffectiveCellHeight(index: number): number {
  return CELL_H + (rowOffsets()[index] ?? 0);
}

export function computeFirstVisible(
  scroll: number,
  offsets: Record<number, number>,
  cellSize: number,
  getEffectiveSize: (index: number) => number,
): PartialCell {
  const nonDefault = Object.keys(offsets)
    .map(Number)
    .sort((a, b) => a - b);

  let i = 0;
  let cum = 0;

  for (const idx of nonDefault) {
    if (idx > i) {
      const gapCount = idx - i;
      const gapSize = gapCount * cellSize;
      if (cum + gapSize >= scroll) {
        const defaultIndexOffset = Math.floor((scroll - cum) / cellSize);
        return {
          index: i + defaultIndexOffset,
          remainder: (scroll - cum) % cellSize,
        };
      }
      cum += gapSize;
      i = idx;
    }
    const effective = getEffectiveSize(idx);
    if (cum + effective >= scroll) {
      return { index: idx, remainder: scroll - cum };
    }
    cum += effective;
    i = idx + 1;
  }

  const defaultCells = Math.floor((scroll - cum) / cellSize);
  return { index: i + defaultCells, remainder: (scroll - cum) % cellSize };
}

export type PartialCell = {
  index: number;
  remainder: number;
};

export function computeFirstVisibleColumn(scrollX: number): PartialCell {
  return computeFirstVisible(
    scrollX,
    colOffsets(),
    CELL_W,
    getEffectiveCellWidth,
  );
}

export function computeFirstVisibleRow(scrollY: number): PartialCell {
  return computeFirstVisible(
    scrollY,
    rowOffsets(),
    CELL_H,
    getEffectiveCellHeight,
  );
}
