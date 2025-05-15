import { watch, ref, watchFn } from "jsx";
import {
  CELL_H,
  CELL_W,
  COLOR_CELL_DARK_HEX,
  COLOR_CELL_LIGHT_HEX,
} from "./config";
import { initInstances } from "./instance";
import type { PartialCell, RegionMap, TextMap, TextQuad } from "./types";
import { Mat4 } from "./math";
import { isTouchscreen } from "./utils";

export const [canvasRect, setCanvasRect] = ref(new DOMRect());
export const [selectedColor, setSelectedColor] = ref("");
export const [ctrlPressed, setCtrlPressed] = ref(isTouchscreen);
export const [scrollEl, setScrollEl] = ref<HTMLDivElement>();
export const [scroll, setScroll] = ref({ x: 0, y: 0 });
export const [touchSelection, setTouchSelection] = ref(false);
export const [cellText, setCellText] = ref("");

export const [prefersDark, setPrefersDark] = ref(
  matchMedia("(prefers-color-scheme: dark)").matches,
);

export const [defaultCellColor, setDefaultCellColor] = ref<string>();
watch(() => {
  setDefaultCellColor(
    prefersDark() ? COLOR_CELL_DARK_HEX : COLOR_CELL_LIGHT_HEX,
  );
});

export const [instances, setInstances] = ref(initInstances(10));
export const [projection, setProjection] = ref(Mat4.identity());

export function createSheet(sheetName: string) {
  const [name, setName] = ref(sheetName);
  const [lastSelectedRegions, setLastSelectedRegions] = ref(new Set<string>());
  const [selectedRegions, setSelectedRegions] = ref(new Set<string>());
  const [selectedQuads, setSelectedQuads] = ref<number[]>([]);
  const [colorRegions, setColorRegions] = ref<RegionMap>({});
  const [colorQuads, setColorQuads] = ref<Record<string, number[]>>({});
  const [textCells, setTextCells] = ref<TextMap>({});
  const [textQuads, setTextQuads] = ref<TextQuad[]>([]);
  const [colOffsets, setColOffsets] = ref<Record<number, number>>({});
  const [rowOffsets, setRowOffsets] = ref<Record<number, number>>({});

  return {
    name,
    setName,
    lastSelectedRegions,
    setLastSelectedRegions,
    selectedRegions,
    setSelectedRegions,
    selectedQuads,
    setSelectedQuads,
    colorRegions,
    setColorRegions,
    colorQuads,
    setColorQuads,
    textCells,
    setTextCells,
    textQuads,
    setTextQuads,
    colOffsets,
    setColOffsets,
    rowOffsets,
    setRowOffsets,
  };
}

export type Sheet = ReturnType<typeof createSheet>;

let lastSheetIdx = 0;
export const [sheets, setSheets] = ref<Sheet[]>([
  createSheet(`sheet${lastSheetIdx++}`),
]);
export const [currentSheet, setCurrentSheet] = ref(sheets()[0]);

watchFn(
  () => currentSheet().name(),
  () => {
    location.hash = `#${encodeURIComponent(currentSheet().name())}`;
  },
);

export function addSheet() {
  setSheets.byRef((sheets) => {
    const idx = sheets.length;
    sheets.push(createSheet(`sheet${lastSheetIdx++}`));
    setCurrentSheet(sheets[idx]);
  });
}

export function delSheet(idx: number) {
  if (sheets()[idx] === currentSheet()) {
    setCurrentSheet(idx === 0 ? sheets()[1] : sheets()[idx - 1]);
  }

  setSheets.byRef((sheets) => sheets.splice(idx, 1));
}

export function setSheet(idx: number) {
  setCurrentSheet(sheets()[idx]);
}

watch(() => {
  document.documentElement.classList[prefersDark() ? "add" : "remove"]("dark");
});

export function getEffectiveCellWidth(index: number): number {
  return CELL_W + (currentSheet().colOffsets()[index] ?? 0);
}

export function getEffectiveCellHeight(index: number): number {
  return CELL_H + (currentSheet().rowOffsets()[index] ?? 0);
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

export function computeFirstVisibleColumn(scrollX: number): PartialCell {
  return computeFirstVisible(
    scrollX,
    currentSheet().colOffsets(),
    CELL_W,
    getEffectiveCellWidth,
  );
}

export function computeFirstVisibleRow(scrollY: number): PartialCell {
  return computeFirstVisible(
    scrollY,
    currentSheet().rowOffsets(),
    CELL_H,
    getEffectiveCellHeight,
  );
}
