import { CELL_H, CELL_W } from "./config";
import {
  colOffsets,
  getEffectiveCellHeight,
  getEffectiveCellWidth,
  rowOffsets,
} from "./state";
import { totalOffsetsRange } from "./utils";

export type GridArea = {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
};

export function addRangeToSet(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const newRange: GridArea = { startCol, startRow, endCol, endRow };
  const allRanges = [...set].map(parseRange);
  allRanges.push(newRange);

  const minimized = fullyMergeRanges(allRanges);

  set.clear();
  for (const r of minimized) {
    set.add(serializeRange(r));
  }
}

export function carveRange(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const input: GridArea = { startCol, startRow, endCol, endRow };
  const existing = [...set].map(parseRange);

  // 1) Chop the input out of all existing rectangles
  const existingFragments = existing.flatMap((r) =>
    rangesOverlap(r, input) ? subtractRect(r, input) : [r],
  );

  // 2) Build the union of all overlapping bits to subtract from the input
  const overlaps = existing.filter((r) => rangesOverlap(r, input));
  //    merge overlapping existing regions first
  const mergedOverlaps = fullyMergeRanges(overlaps);

  // 3) Chop that union out of the input
  let inputFragments: GridArea[] = [input];
  for (const u of mergedOverlaps) {
    inputFragments = inputFragments.flatMap((f) =>
      rangesOverlap(f, u) ? subtractRect(f, u) : [f],
    );
  }

  // 4) Combine leftovers from existing + leftovers of input, then fully re-merge
  const result = fullyMergeRanges([...existingFragments, ...inputFragments]);

  set.clear();
  for (const r of result) set.add(serializeRange(r));
}

export function rangeToQuad(range: GridArea) {
  const offsetSX = totalOffsetsRange(0, range.startCol - 1, colOffsets());
  const offsetSY = totalOffsetsRange(0, range.startRow - 1, rowOffsets());
  const sx = range.startCol * CELL_W + offsetSX;
  const sy = range.startRow * CELL_H + offsetSY;

  const offsetEX = totalOffsetsRange(0, range.endCol - 1, colOffsets());
  const offsetEY = totalOffsetsRange(0, range.endRow - 1, rowOffsets());
  const ex =
    range.endCol * CELL_W + offsetEX + getEffectiveCellWidth(range.endCol);
  const ey =
    range.endRow * CELL_H + offsetEY + getEffectiveCellHeight(range.endRow);

  return [sx, sy, ex - sx, ey - sy];
}

export function serializeRange(range: GridArea): string {
  return `${range.startCol},${range.startRow}:${range.endCol},${range.endRow}`;
}

export function parseRange(s: string): GridArea {
  const [start, end] = s.split(":");
  const [sc, sr] = start.split(",").map(Number);
  const [ec, er] = end.split(",").map(Number);
  return { startCol: sc, startRow: sr, endCol: ec, endRow: er };
}

export function rangesOverlap(a: GridArea, b: GridArea): boolean {
  return (
    a.startCol <= b.endCol &&
    a.endCol >= b.startCol &&
    a.startRow <= b.endRow &&
    a.endRow >= b.startRow
  );
}

function subtractRect(base: GridArea, cut: GridArea): GridArea[] {
  const parts: GridArea[] = [];

  // top band
  if (cut.startRow > base.startRow) {
    parts.push({
      startCol: base.startCol,
      endCol: base.endCol,
      startRow: base.startRow,
      endRow: cut.startRow - 1,
    });
  }
  // bottom band
  if (cut.endRow < base.endRow) {
    parts.push({
      startCol: base.startCol,
      endCol: base.endCol,
      startRow: cut.endRow + 1,
      endRow: base.endRow,
    });
  }
  // middle slice
  const midTop = Math.max(base.startRow, cut.startRow);
  const midBottom = Math.min(base.endRow, cut.endRow);

  if (midTop <= midBottom) {
    // left panel
    if (cut.startCol > base.startCol) {
      parts.push({
        startCol: base.startCol,
        endCol: cut.startCol - 1,
        startRow: midTop,
        endRow: midBottom,
      });
    }
    // right panel
    if (cut.endCol < base.endCol) {
      parts.push({
        startCol: cut.endCol + 1,
        endCol: base.endCol,
        startRow: midTop,
        endRow: midBottom,
      });
    }
  }

  return parts;
}

function fullyMergeRanges(r: GridArea[]): GridArea[] {
  let ranges = r;
  let changed = true;
  const mergeTwo = (a: GridArea, b: GridArea): GridArea => ({
    startCol: Math.min(a.startCol, b.startCol),
    startRow: Math.min(a.startRow, b.startRow),
    endCol: Math.max(a.endCol, b.endCol),
    endRow: Math.max(a.endRow, b.endRow),
  });

  const adjacentOrOverlap = (a: GridArea, b: GridArea) =>
    rangesOverlap(a, b) ||
    (a.startRow === b.startRow &&
      a.endRow === b.endRow &&
      (a.endCol + 1 === b.startCol || b.endCol + 1 === a.startCol)) ||
    (a.startCol === b.startCol &&
      a.endCol === b.endCol &&
      (a.endRow + 1 === b.startRow || b.endRow + 1 === a.startRow));

  while (changed) {
    changed = false;
    const out: GridArea[] = [];
    while (ranges.length > 0) {
      let curr = ranges.shift() as GridArea;
      let mergedAny = false;
      for (let i = 0; i < ranges.length; i++) {
        if (adjacentOrOverlap(curr, ranges[i])) {
          curr = mergeTwo(curr, ranges[i]);
          ranges.splice(i, 1);
          mergedAny = changed = true;
          break;
        }
      }
      out.push(curr);
    }
    ranges = out;
  }

  return ranges;
}

export function addSubtractingIntersectingUnion(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const input: GridArea = { startCol, startRow, endCol, endRow };
  const existing = [...set].map(parseRange);

  // 1) Chop each existing region by the input if they overlap
  const existingFragments: GridArea[] = [];
  const overlaps: GridArea[] = [];
  for (const r of existing) {
    if (rangesOverlap(r, input)) {
      overlaps.push(r);
      existingFragments.push(...subtractRect(r, input));
    } else {
      existingFragments.push(r);
    }
  }

  // 2) If no overlaps, just behave like addRangeToSet
  if (overlaps.length === 0) {
    const merged = fullyMergeRanges([...existingFragments, input]);
    set.clear();
    for (const r of merged) set.add(serializeRange(r));
    return;
  }

  // 3) Merge all overlapping existing regions, then carve that union out of the input
  const mergedOverlaps = fullyMergeRanges(overlaps);
  let inputFragments: GridArea[] = [input];
  for (const u of mergedOverlaps) {
    inputFragments = inputFragments.flatMap((f) =>
      rangesOverlap(f, u) ? subtractRect(f, u) : [f],
    );
  }

  // 4) Combine the leftover existing fragments + leftover input fragments, then re-merge
  const finalList = fullyMergeRanges([...existingFragments, ...inputFragments]);

  set.clear();
  for (const r of finalList) {
    set.add(serializeRange(r));
  }
}
