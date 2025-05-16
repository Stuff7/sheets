

import { CELL_H, CELL_W } from "./config";
import {
  getEffectiveCellHeight,
  getEffectiveCellWidth,
  currentSheet,
} from "./state";
import { totalOffsetsRange } from "./utils";

export type Region = {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
};

export function addRegionToSet(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const newRegion: Region = { startCol, startRow, endCol, endRow };
  const allRegions = [...set].map(parseRegion);
  allRegions.push(newRegion);

  const minimized = fullyMergeRegion(allRegions);

  set.clear();
  for (const r of minimized) {
    set.add(serializeRegion(r));
  }
}

export function removeRegionFromSet(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const cut: Region = { startCol, startRow, endCol, endRow };
  const updated: Region[] = [];

  for (const s of set) {
    const r = parseRegion(s);
    if (regionsOverlap(r, cut)) {
      updated.push(...subtractRect(r, cut));
    } else {
      updated.push(r);
    }
  }

  const merged = fullyMergeRegion(updated);
  set.clear();
  for (const r of merged) {
    set.add(serializeRegion(r));
  }
}

export function carveRegion(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const input: Region = { startCol, startRow, endCol, endRow };
  const existing = [...set].map(parseRegion);

  // 1) Chop the input out of all existing rectangles
  const existingFragments = existing.flatMap((r) =>
    regionsOverlap(r, input) ? subtractRect(r, input) : [r],
  );

  // 2) Build the union of all overlapping bits to subtract from the input
  const overlaps = existing.filter((r) => regionsOverlap(r, input));
  //    merge overlapping existing regions first
  const mergedOverlaps = fullyMergeRegion(overlaps);

  // 3) Chop that union out of the input
  let inputFragments: Region[] = [input];
  for (const u of mergedOverlaps) {
    inputFragments = inputFragments.flatMap((f) =>
      regionsOverlap(f, u) ? subtractRect(f, u) : [f],
    );
  }

  // 4) Combine leftovers from existing + leftovers of input, then fully re-merge
  const result = fullyMergeRegion([...existingFragments, ...inputFragments]);

  set.clear();
  for (const r of result) set.add(serializeRegion(r));
}

export function regionToQuad(region: Region) {
  const offsetSX = totalOffsetsRange(
    0,
    region.startCol - 1,
    currentSheet().colOffsets(),
  );
  const offsetSY = totalOffsetsRange(
    0,
    region.startRow - 1,
    currentSheet().rowOffsets(),
  );
  const sx = region.startCol * CELL_W + offsetSX;
  const sy = region.startRow * CELL_H + offsetSY;

  const offsetEX = totalOffsetsRange(
    0,
    region.endCol - 1,
    currentSheet().colOffsets(),
  );
  const offsetEY = totalOffsetsRange(
    0,
    region.endRow - 1,
    currentSheet().rowOffsets(),
  );
  const ex =
    region.endCol * CELL_W + offsetEX + getEffectiveCellWidth(region.endCol);
  const ey =
    region.endRow * CELL_H + offsetEY + getEffectiveCellHeight(region.endRow);

  return [sx, sy, ex - sx, ey - sy];
}

export function serializeRegion(region: Region): string {
  return `${region.startCol},${region.startRow}:${region.endCol},${region.endRow}`;
}

export function parseRegion(s: string): Region {
  const [start, end] = s.split(":");
  const [sc, sr] = start.split(",").map(Number);
  const [ec, er] = end.split(",").map(Number);
  return { startCol: sc, startRow: sr, endCol: ec, endRow: er };
}

export function regionsOverlap(a: Region, b: Region): boolean {
  return (
    a.startCol <= b.endCol &&
    a.endCol >= b.startCol &&
    a.startRow <= b.endRow &&
    a.endRow >= b.startRow
  );
}

function subtractRect(base: Region, cut: Region): Region[] {
  const parts: Region[] = [];

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

function fullyMergeRegion(r: Region[]): Region[] {
  let regions = r;
  let changed = true;
  const mergeTwo = (a: Region, b: Region): Region => ({
    startCol: Math.min(a.startCol, b.startCol),
    startRow: Math.min(a.startRow, b.startRow),
    endCol: Math.max(a.endCol, b.endCol),
    endRow: Math.max(a.endRow, b.endRow),
  });

  const adjacentOrOverlap = (a: Region, b: Region) =>
    regionsOverlap(a, b) ||
    (a.startRow === b.startRow &&
      a.endRow === b.endRow &&
      (a.endCol + 1 === b.startCol || b.endCol + 1 === a.startCol)) ||
    (a.startCol === b.startCol &&
      a.endCol === b.endCol &&
      (a.endRow + 1 === b.startRow || b.endRow + 1 === a.startRow));

  while (changed) {
    changed = false;
    const out: Region[] = [];
    while (regions.length > 0) {
      let curr = regions.shift() as Region;
      let mergedAny = false;
      for (let i = 0; i < regions.length; i++) {
        if (adjacentOrOverlap(curr, regions[i])) {
          curr = mergeTwo(curr, regions[i]);
          regions.splice(i, 1);
          mergedAny = changed = true;
          break;
        }
      }
      out.push(curr);
    }
    regions = out;
  }

  return regions;
}

export function addSubtractingIntersectingUnion(
  set: Set<string>,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
) {
  const input: Region = { startCol, startRow, endCol, endRow };
  const existing = [...set].map(parseRegion);

  // 1) Chop each existing region by the input if they overlap
  const existingFragments: Region[] = [];
  const overlaps: Region[] = [];
  for (const r of existing) {
    if (regionsOverlap(r, input)) {
      overlaps.push(r);
      existingFragments.push(...subtractRect(r, input));
    } else {
      existingFragments.push(r);
    }
  }

  // 2) If no overlaps, just behave like addRegionToSet
  if (overlaps.length === 0) {
    const merged = fullyMergeRegion([...existingFragments, input]);
    set.clear();
    for (const r of merged) set.add(serializeRegion(r));
    return;
  }

  // 3) Merge all overlapping existing regions, then carve that union out of the input
  const mergedOverlaps = fullyMergeRegion(overlaps);
  let inputFragments: Region[] = [input];
  for (const u of mergedOverlaps) {
    inputFragments = inputFragments.flatMap((f) =>
      regionsOverlap(f, u) ? subtractRect(f, u) : [f],
    );
  }

  // 4) Combine the leftover existing fragments + leftover input fragments, then re-merge
  const finalList = fullyMergeRegion([...existingFragments, ...inputFragments]);

  set.clear();
  for (const r of finalList) {
    set.add(serializeRegion(r));
  }
}
