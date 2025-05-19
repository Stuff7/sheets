import { parseRegion } from "./region";
import { sheets } from "./state";
import type { OffsetMap, TextMap, RegionMap, FontStyle } from "./types";
import { hexToRgba } from "./utils";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FORMAT,
} from "./config";

// Constants
const XLSX_MAGIC = "XLSX";
const XLSX_VERSION = 3;
const HEADER_FIXED = 4 + 2 + 4 + 4; // magic + version + sheetCount + colorCount
const LEN16 = 2;
const CNT32 = 4;
const COLOR_ENTRY_SIZE = 1 + 3;
const REGION_BLOCK_SIZE = 1 + 4 + 4 + 2 + 2;
const OFFSET_ENTRY_SIZE = 4 + 2;

// Helper IDs for style extras
const STYLE_ID_FAMILY = 1;
const STYLE_ID_SIZE = 2;
const STYLE_ID_COLOR = 3;
const STYLE_ID_FORMAT = 4; // New

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

// Encode
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

  // 2) Prepare sheet blocks
  type SD = {
    nameBytes: Uint8Array;
    regionBlocks: Array<{
      cid: number;
      sr: number;
      sc: number;
      rs: number;
      cs: number;
    }>;
    textBlocks: Array<{
      idx: number;
      textBytes: Uint8Array;
      flags: number;
      extras: (Uint8Array | number)[];
      extraIDs: number[];
    }>;
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

    const textBlocks = Object.entries(texts).map(([k, cell]) => {
      const idx = +k;
      const textBytes = encoder.encode(cell.text);
      // pack style flags
      let flags = 0;
      if (cell.style.bold) flags |= 1;
      if (cell.style.italic) flags |= 2;
      if (cell.style.underline) flags |= 4;
      if (cell.style.strikethrough) flags |= 8;

      const extras: (Uint8Array | number)[] = [];
      const extraIDs: number[] = [];

      // family
      if (cell.style.family !== DEFAULT_FONT_FAMILY) {
        extraIDs.push(STYLE_ID_FAMILY);
        const b = encoder.encode(cell.style.family);
        extras.push(new Uint8Array([b.length, ...b]));
      }
      // size
      if (cell.style.size !== DEFAULT_FONT_SIZE) {
        extraIDs.push(STYLE_ID_SIZE);
        extras.push(cell.style.size);
      }
      // color
      if (cell.style.color !== DEFAULT_FONT_COLOR) {
        extraIDs.push(STYLE_ID_COLOR);
        const c = encoder.encode(cell.style.color);
        extras.push(new Uint8Array([c.length, ...c]));
      }
      // format
      if (cell.style.format && cell.style.format !== "") {
        extraIDs.push(STYLE_ID_FORMAT);
        const fmtBytes = encoder.encode(cell.style.format);
        extras.push(new Uint8Array([fmtBytes.length, ...fmtBytes]));
      }

      return { idx, textBytes, flags, extras, extraIDs };
    });

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

  // 3) compute total size
  let size = HEADER_FIXED + colors.length * COLOR_ENTRY_SIZE;
  for (const s of sheetsData) {
    size += LEN16 + s.nameBytes.length;
    size += CNT32 * 4;
    size += s.regionBlocks.length * REGION_BLOCK_SIZE;
    for (const t of s.textBlocks) {
      size += 4 + 2 + t.textBytes.length + 1 + 1;
      for (let j = 0; j < t.extras.length; j++) {
        const data = t.extras[j];
        size += 1;
        if (typeof data === "number") {
          size += 2;
        } else {
          size += data.byteLength;
        }
      }
    }
    size += s.rowOff.length * OFFSET_ENTRY_SIZE;
    size += s.colOff.length * OFFSET_ENTRY_SIZE;
  }

  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let o = 0;

  // HEADER
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

  // COLORS
  colors.forEach((rgb, i) => {
    view.setUint8(o++, i);
    for (const c of rgb) view.setUint8(o++, c);
  });

  // SHEETS
  for (const s of sheetsData) {
    view.setUint16(o, s.nameBytes.length, true);
    o += 2;
    u8.set(s.nameBytes, o);
    o += s.nameBytes.length;

    view.setUint32(o, s.regionBlocks.length, true);
    o += 4;
    view.setUint32(o, s.textBlocks.length, true);
    o += 4;
    view.setUint32(o, s.rowOff.length, true);
    o += 4;
    view.setUint32(o, s.colOff.length, true);
    o += 4;

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

    for (const t of s.textBlocks) {
      view.setUint32(o, t.idx, true);
      o += 4;
      view.setUint16(o, t.textBytes.length, true);
      o += 2;
      u8.set(t.textBytes, o);
      o += t.textBytes.length;

      view.setUint8(o, t.flags);
      o += 1;
      view.setUint8(o, t.extras.length);
      o += 1;

      for (let j = 0; j < t.extras.length; j++) {
        view.setUint8(o, t.extraIDs[j]);
        o += 1;
        const data = t.extras[j];
        if (typeof data === "number") {
          view.setUint16(o, data, true);
          o += 2;
        } else {
          u8.set(data, o);
          o += data.byteLength;
        }
      }
    }

    for (const r of s.rowOff) {
      view.setUint32(o, r.i, true);
      o += 4;
      view.setInt16(o, r.d, true);
      o += 2;
    }
    for (const c of s.colOff) {
      view.setUint32(o, c.i, true);
      o += 4;
      view.setInt16(o, c.d, true);
      o += 2;
    }
  }

  return new Uint8Array(buf, 0, o);
}

// Decode
export function decodeXLSXData(data: Uint8Array): Sheets {
  const decoder = new TextDecoder();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let o = 0;

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

  const colorTable: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    const id = view.getUint8(o++);
    const r = view.getUint8(o++);
    const g = view.getUint8(o++);
    const b = view.getUint8(o++);
    colorTable[id] =
      `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }

  const result: Sheets = {};
  for (let s = 0; s < sheetCount; s++) {
    const nameLen = view.getUint16(o, true);
    o += 2;
    const name = decoder.decode(data.subarray(o, o + nameLen));
    o += nameLen;

    const rCnt = view.getUint32(o, true);
    o += 4;
    const tCnt = view.getUint32(o, true);
    o += 4;
    const roCnt = view.getUint32(o, true);
    o += 4;
    const coCnt = view.getUint32(o, true);
    o += 4;

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
      const flags = view.getUint8(o++);
      const extraCount = view.getUint8(o++);

      const style: FontStyle = {
        family: DEFAULT_FONT_FAMILY,
        size: DEFAULT_FONT_SIZE,
        color: DEFAULT_FONT_COLOR,
        bold: !!(flags & 1),
        italic: !!(flags & 2),
        underline: !!(flags & 4),
        strikethrough: !!(flags & 8),
        format: DEFAULT_FONT_FORMAT,
      };

      for (let e = 0; e < extraCount; e++) {
        const id = view.getUint8(o++);
        if (id === STYLE_ID_FAMILY) {
          const len = view.getUint8(o++);
          style.family = decoder.decode(data.subarray(o, o + len));
          o += len;
        } else if (id === STYLE_ID_SIZE) {
          style.size = view.getUint16(o, true);
          o += 2;
        } else if (id === STYLE_ID_COLOR) {
          const len = view.getUint8(o++);
          style.color = decoder.decode(data.subarray(o, o + len));
          o += len;
        } else if (id === STYLE_ID_FORMAT) {
          const len = view.getUint8(o++);
          style.format = decoder.decode(data.subarray(o, o + len));
          o += len;
        }
      }

      texts[idx] = { text: str, style, computed: "" };
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
