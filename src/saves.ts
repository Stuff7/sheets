import { parseRegion } from "./region";
import { sheets } from "./state";
import type { OffsetMap, TextMap, RegionMap } from "./types";
import { hexToRgba } from "./utils";

// Constants
const XLSX_MAGIC = "XLSX";
const XLSX_VERSION = 3;
const HEADER_FIXED =
  4 /* magic */ + 2 /* version */ + 4 /* sheetCount */ + 4 /* colorCount */;
const LEN16 = 2;
const CNT32 = 4;
const COLOR_ENTRY_SIZE = 1 + 3; // id + RGB
const REGION_BLOCK_SIZE = 1 + 4 + 4 + 2 + 2;
const TEXT_HEADER_SIZE = 4 + 2; // idx + length
const OFFSET_ENTRY_SIZE = 4 + 2; // index + delta

type SheetData = {
  regions: RegionMap;
  texts: TextMap;
  rowOffsets: OffsetMap;
  colOffsets: OffsetMap;
};

type Sheets = Record<string, SheetData>;

export function formatSheetData() {
  const data: Sheets = {};

  for (const sheet of sheets()) {
    data[sheet.name()] = {
      regions: sheet.colorRegions(),
      texts: sheet.textCells(),
      rowOffsets: sheet.rowOffsets(),
      colOffsets: sheet.colOffsets(),
    };
  }

  return data;
}

export function encodeXLSXData(sheets: Sheets): Uint8Array {
  const encoder = new TextEncoder();
  // 1) Build global color table
  const colorMap = new Map<string, number>();
  const colors: [number, number, number][] = [];
  for (const { regions } of Object.values(sheets)) {
    for (const hex of Object.keys(regions)) {
      if (!colorMap.has(hex)) {
        const [r, g, b] = hexToRgba(hex).map((v) => Math.floor(v * 256));
        colorMap.set(hex, colors.length);
        colors.push([r, g, b]);
      }
    }
  }

  // 2) Precompute each sheet’s blocks & sizes
  type SD = {
    nameBytes: Uint8Array;
    regionBlocks: Array<{
      cid: number;
      sr: number;
      sc: number;
      rs: number;
      cs: number;
    }>;
    textBlocks: Array<{ idx: number; data: Uint8Array }>;
    rowOff: Array<{ i: number; d: number }>;
    colOff: Array<{ i: number; d: number }>;
  };
  const sheetsData: SD[] = [];
  for (const [
    name,
    { regions, texts, rowOffsets, colOffsets },
  ] of Object.entries(sheets)) {
    const nameBytes = encoder.encode(name);
    const regionBlocks = Object.entries(regions).flatMap(([hex, set]) => {
      const cid = colorMap.get(hex) as number;
      return Array.from(set).map((key) => {
        const {
          startRow: sr,
          startCol: sc,
          endRow: er,
          endCol: ec,
        } = parseRegion(key);
        return { cid, sr, sc, rs: er - sr + 1, cs: ec - sc + 1 };
      });
    });
    const textBlocks = Object.entries(texts).map(([k, v]) => ({
      idx: +k,
      data: encoder.encode(v),
    }));
    const rowOff = Object.entries(rowOffsets).map(([k, v]) => ({
      i: +k,
      d: v,
    }));
    const colOff = Object.entries(colOffsets).map(([k, v]) => ({
      i: +k,
      d: v,
    }));
    sheetsData.push({ nameBytes, regionBlocks, textBlocks, rowOff, colOff });
  }

  // 3) Total size
  let size = HEADER_FIXED + colors.length * COLOR_ENTRY_SIZE;
  for (const s of sheetsData) {
    size += LEN16 + s.nameBytes.length; // sheet name
    size += CNT32 * 4; // 4 counts
    size += s.regionBlocks.length * REGION_BLOCK_SIZE;
    for (const t of s.textBlocks) size += TEXT_HEADER_SIZE + t.data.length;
    size += s.rowOff.length * OFFSET_ENTRY_SIZE;
    size += s.colOff.length * OFFSET_ENTRY_SIZE;
  }

  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let o = 0;

  // === HEADER ===
  u8.set(
    [...XLSX_MAGIC].map((c) => c.charCodeAt(0)),
    o,
  );
  o += 4;
  view.setUint16(o, XLSX_VERSION, true);
  o += 2;
  view.setUint32(o, sheetsData.length, true);
  o += 4;
  view.setUint32(o, colors.length, true);
  o += 4;

  // === COLORS ===
  colors.forEach((rgb, i) => {
    view.setUint8(o++, i);
    for (const c of rgb) {
      view.setUint8(o++, c);
    }
  });

  // === SHEETS ===
  for (const s of sheetsData) {
    // name
    view.setUint16(o, s.nameBytes.length, true);
    o += LEN16;
    u8.set(s.nameBytes, o);
    o += s.nameBytes.length;
    // counts
    view.setUint32(o, s.regionBlocks.length, true);
    o += CNT32;
    view.setUint32(o, s.textBlocks.length, true);
    o += CNT32;
    view.setUint32(o, s.rowOff.length, true);
    o += CNT32;
    view.setUint32(o, s.colOff.length, true);
    o += CNT32;
    // region blocks
    for (const r of s.regionBlocks) {
      view.setUint8(o++, r.cid);
      view.setUint32(o, r.sr, true);
      o += 4;
      view.setUint32(o, r.sc, true);
      o += 4;
      view.setUint16(o, r.rs, true);
      o += 2;
      view.setUint16(o, r.cs, true);
      o += 2;
    }
    // texts
    for (const t of s.textBlocks) {
      view.setUint32(o, t.idx, true);
      o += 4;
      view.setUint16(o, t.data.length, true);
      o += 2;
      u8.set(t.data, o);
      o += t.data.length;
    }
    // row offsets
    for (const r of s.rowOff) {
      view.setUint32(o, r.i, true);
      o += 4;
      view.setInt16(o, r.d, true);
      o += 2;
    }
    // col offsets
    for (const c of s.colOff) {
      view.setUint32(o, c.i, true);
      o += 4;
      view.setInt16(o, c.d, true);
      o += 2;
    }
  }

  return new Uint8Array(buf, 0, o);
}

export function decodeXLSXData(data: Uint8Array): Sheets {
  const decoder = new TextDecoder();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let o = 0;

  // HEADER
  const magic = decoder.decode(data.subarray(o, o + 4));
  if (magic !== XLSX_MAGIC) throw new Error("Invalid XLSX_MAGIC");
  o += 4;
  const version = view.getUint16(o, true);
  o += 2;
  if (version !== XLSX_VERSION) throw new Error("Unsupported XLSX_VERSION");
  const sheetCount = view.getUint32(o, true);
  o += 4;
  const colorCount = view.getUint32(o, true);
  o += 4;

  // GLOBAL COLOR TABLE
  const colorTable: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    const id = view.getUint8(o++);
    const r = view.getUint8(o++);
    const g = view.getUint8(o++);
    const b = view.getUint8(o++);
    colorTable[id] =
      `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }

  // SHEETS
  const result: Record<string, SheetData> = {};
  for (let s = 0; s < sheetCount; s++) {
    const nameLen = view.getUint16(o, true);
    o += LEN16;
    const name = decoder.decode(data.subarray(o, o + nameLen));
    o += nameLen;

    const rCnt = view.getUint32(o, true);
    o += CNT32;
    const tCnt = view.getUint32(o, true);
    o += CNT32;
    const roCnt = view.getUint32(o, true);
    o += CNT32;
    const coCnt = view.getUint32(o, true);
    o += CNT32;

    const regions: RegionMap = {};
    for (let i = 0; i < rCnt; i++) {
      const cid = view.getUint8(o++);
      const sr = view.getUint32(o, true);
      o += 4;
      const sc = view.getUint32(o, true);
      o += 4;
      const rs = view.getUint16(o, true);
      o += 2;
      const cs = view.getUint16(o, true);
      o += 2;
      const er = sr + rs - 1;
      const ec = sc + cs - 1;
      const key = `${sc},${sr}:${ec},${er}`;
      const hex = colorTable[cid];
      if (!regions[hex]) regions[hex] = new Set();
      regions[hex].add(key);
    }

    const texts: TextMap = {};
    for (let i = 0; i < tCnt; i++) {
      const idx = view.getUint32(o, true);
      o += 4;
      const L = view.getUint16(o, true);
      o += 2;
      const str = decoder.decode(data.subarray(o, o + L));
      o += L;
      texts[idx] = str;
    }

    const rowOffsets: OffsetMap = {};
    for (let i = 0; i < roCnt; i++) {
      const idx = view.getUint32(o, true);
      o += 4;
      const d = view.getInt16(o, true);
      o += 2;
      rowOffsets[idx] = d;
    }

    const colOffsets: OffsetMap = {};
    for (let i = 0; i < coCnt; i++) {
      const idx = view.getUint32(o, true);
      o += 4;
      const d = view.getInt16(o, true);
      o += 2;
      colOffsets[idx] = d;
    }

    result[name] = { regions, texts, rowOffsets, colOffsets };
  }

  return result;
}
