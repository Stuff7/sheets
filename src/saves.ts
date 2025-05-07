import { parseRegion } from "./region";
import type { OffsetMap, TextMap, RegionMap } from "./types";
import { hexToRgba } from "./utils";

export function encodeXLSXData(
  regions: RegionMap,
  texts: TextMap,
  rowOffsets: OffsetMap,
  colOffsets: OffsetMap,
): Uint8Array {
  const encoder = new TextEncoder();

  // === Color Indexing ===
  const colorEntries: {
    id: number;
    rgb: [number, number, number];
    hex: string;
  }[] = [];
  const colorMap = new Map<string, number>();
  let colorId = 0;

  for (const hex of Object.keys(regions)) {
    const [r, g, b] = hexToRgba(hex).map((n) => n * 256);
    colorMap.set(hex, colorId);
    colorEntries.push({ id: colorId++, rgb: [r, g, b], hex });
  }

  // === Regions ===
  const regionBlocks = Object.entries(regions).flatMap(([hex, set]) => {
    const cid = colorMap.get(hex) as number;
    return Array.from(set).map((key) => {
      const { startCol, startRow, endCol, endRow } = parseRegion(key);
      return {
        colorId: cid,
        startCol,
        startRow,
        colSpan: endCol - startCol + 1,
        rowSpan: endRow - startRow + 1,
      };
    });
  });

  // === Offsets ===
  const rowOffsetEntries = Object.entries(rowOffsets).map(([k, v]) => ({
    index: Number.parseInt(k),
    delta: v,
  }));
  const colOffsetEntries = Object.entries(colOffsets).map(([k, v]) => ({
    index: Number.parseInt(k),
    delta: v,
  }));

  // === Texts ===
  const textEntries = Object.entries(texts).map(([k, v]) => ({
    idx: Number.parseInt(k),
    bytes: encoder.encode(v),
  }));

  // === Size Calculation ===
  let size = 4 + 2 + 4 * 5; // magic + version + 5 counts
  size += colorEntries.length * 4;
  size += regionBlocks.length * (1 + 4 + 4 + 2 + 2);
  for (const { bytes } of textEntries) size += 4 + 2 + bytes.length;
  size += rowOffsetEntries.length * 6;
  size += colOffsetEntries.length * 6;

  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  let offset = 0;

  // === Header ===
  u8.set(
    [..."XLSX"].map((c) => c.charCodeAt(0)),
    offset,
  );
  offset += 4;
  view.setUint16(offset, 2, true);
  offset += 2;
  view.setUint32(offset, regionBlocks.length, true);
  offset += 4;
  view.setUint32(offset, textEntries.length, true);
  offset += 4;
  view.setUint32(offset, colorEntries.length, true);
  offset += 4;
  view.setUint32(offset, rowOffsetEntries.length, true);
  offset += 4;
  view.setUint32(offset, colOffsetEntries.length, true);
  offset += 4;

  // === Colors ===
  for (const { id, rgb } of colorEntries) {
    view.setUint8(offset++, id);
    for (const c of rgb) view.setUint8(offset++, c);
  }

  // === Regions ===
  for (const r of regionBlocks) {
    view.setUint8(offset++, r.colorId);
    view.setUint32(offset, r.startRow, true);
    offset += 4;
    view.setUint32(offset, r.startCol, true);
    offset += 4;
    view.setUint16(offset, r.rowSpan, true);
    offset += 2;
    view.setUint16(offset, r.colSpan, true);
    offset += 2;
  }

  // === Texts ===
  for (const { idx, bytes } of textEntries) {
    view.setUint32(offset, idx, true);
    offset += 4;
    view.setUint16(offset, bytes.length, true);
    offset += 2;
    u8.set(bytes, offset);
    offset += bytes.length;
  }

  // === Row Offsets ===
  for (const { index, delta } of rowOffsetEntries) {
    view.setUint32(offset, index, true);
    offset += 4;
    view.setInt16(offset, delta, true);
    offset += 2;
  }

  // === Col Offsets ===
  for (const { index, delta } of colOffsetEntries) {
    view.setUint32(offset, index, true);
    offset += 4;
    view.setInt16(offset, delta, true);
    offset += 2;
  }

  return new Uint8Array(buffer, 0, offset);
}

export function decodeXLSXData(data: Uint8Array): {
  regions: RegionMap;
  texts: TextMap;
  rowOffsets: OffsetMap;
  colOffsets: OffsetMap;
} {
  const decoder = new TextDecoder();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const u8 = data;
  let offset = 0;

  // === Header ===
  const magic = decoder.decode(u8.slice(offset, offset + 4));
  if (magic !== "XLSX") throw new Error("Invalid file format");
  offset += 4;

  const version = view.getUint16(offset, true);
  offset += 2;
  if (version !== 2) throw new Error("Unsupported version");

  const regionCount = view.getUint32(offset, true);
  offset += 4;
  const textCount = view.getUint32(offset, true);
  offset += 4;
  const colorCount = view.getUint32(offset, true);
  offset += 4;
  const rowOffsetCount = view.getUint32(offset, true);
  offset += 4;
  const colOffsetCount = view.getUint32(offset, true);
  offset += 4;

  // === Color Table ===
  const colorTable: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    const id = view.getUint8(offset++);
    const r = view.getUint8(offset++);
    const g = view.getUint8(offset++);
    const b = view.getUint8(offset++);
    const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    colorTable[id] = hex;
  }

  // === Regions ===
  const regions: RegionMap = {};
  for (let i = 0; i < regionCount; i++) {
    const colorId = view.getUint8(offset++);
    const startRow = view.getUint32(offset, true);
    offset += 4;
    const startCol = view.getUint32(offset, true);
    offset += 4;
    const rowSpan = view.getUint16(offset, true);
    offset += 2;
    const colSpan = view.getUint16(offset, true);
    offset += 2;

    const endRow = startRow + rowSpan - 1;
    const endCol = startCol + colSpan - 1;
    const regionStr = `${startCol},${startRow}:${endCol},${endRow}`;

    const hex = colorTable[colorId];
    if (!regions[hex]) regions[hex] = new Set();
    regions[hex].add(regionStr);
  }

  // === Texts ===
  const texts: TextMap = {};
  for (let i = 0; i < textCount; i++) {
    const idx = view.getUint32(offset, true);
    offset += 4;
    const length = view.getUint16(offset, true);
    offset += 2;
    const str = decoder.decode(u8.slice(offset, offset + length));
    offset += length;
    texts[idx] = str;
  }

  // === Row Offsets ===
  const rowOffsets: OffsetMap = {};
  for (let i = 0; i < rowOffsetCount; i++) {
    const index = view.getUint32(offset, true);
    offset += 4;
    const delta = view.getInt16(offset, true);
    offset += 2;
    rowOffsets[index] = delta;
  }

  // === Col Offsets ===
  const colOffsets: OffsetMap = {};
  for (let i = 0; i < colOffsetCount; i++) {
    const index = view.getUint32(offset, true);
    offset += 4;
    const delta = view.getInt16(offset, true);
    offset += 2;
    colOffsets[index] = delta;
  }

  return { regions, texts, rowOffsets, colOffsets };
}
