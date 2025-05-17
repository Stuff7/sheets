import { Parser, type ASTNode } from "./parser";
import {
  getCellIdx,
  fromAlphaUpper,
  fromAlphaLower,
  toAlphaUpper,
  toAlphaLower,
} from "../utils";
import type { Sheets } from "~/types";
import { FUNCTIONS } from "./builtin";

/**
 * Evaluate a formula within a named sheet context; returns single number.
 */
export function evaluateFormula(
  formula: string,
  sheetName: string,
  sheets: Sheets,
): number {
  const ast = new Parser(formula).parseExpression();
  const result = evaluate(ast, sheetName, sheets);
  if (typeof result === "number") return result;
  throw new Error(`Formula did not evaluate to a single number: ${formula}`);
}

// Internal eval can return either number or number[]
export type EvalResult = number | number[];

/**
 * Recursively evaluate AST; ranges => number[].
 */
function evaluate(
  node: ASTNode,
  sheetName: string,
  sheets: Sheets,
): EvalResult {
  switch (node.type) {
    case "number":
      return node.value;

    case "cell": {
      const [c, r] = parseCellId(node.id);
      const targetSheet = node.sheet || sheetName;
      const sheet = sheets[targetSheet];
      if (!sheet) throw new Error(`Sheet not found: ${targetSheet}`);
      const idx = getCellIdx(c, r);
      const cell = sheet[idx];
      if (!cell)
        throw new Error(`Cell ${node.id} not found in sheet ${targetSheet}`);
      return evaluateFormula(cell.text, targetSheet, sheets);
    }

    case "range":
      return flattenRange(node, sheetName, sheets);

    case "binary": {
      const L = evaluate(node.left, sheetName, sheets);
      const R = evaluate(node.right, sheetName, sheets);
      if (Array.isArray(L) || Array.isArray(R))
        throw new Error("Cannot use + - * / on arrays");
      switch (node.op) {
        case "+":
          return L + R;
        case "-":
          return L - R;
        case "*":
          return L * R;
        case "/":
          return L / R;
        default:
          throw new Error(`Unknown operator: ${node.op}`);
      }
    }

    case "func": {
      const rawArgs = node.args.map((arg) => evaluate(arg, sheetName, sheets));
      const name = node.name.toUpperCase();

      const fn = FUNCTIONS[name];
      if (!fn) throw new Error(`Unknown function: ${node.name}`);
      return fn(rawArgs);
    }
  }
}

/** Helper: convert Range AST into an array of cell values */
function flattenRange(
  node: { start: string; end: string; sheet?: string },
  sheetName: string,
  sheets: Sheets,
): number[] {
  const targetSheet = node.sheet || sheetName;
  const sheet = sheets[targetSheet];
  if (!sheet) throw new Error(`Sheet not found: ${targetSheet}`);

  // Detect full column (e.g., A:A)
  const fullColumn = /^[A-Z]+$/.test(node.start) && node.start === node.end;
  // Detect full row (e.g., b:b)
  const fullRow = /^[a-z]+$/.test(node.start) && node.start === node.end;

  let sc: number;
  let ec: number;
  let sr: number;
  let er: number;

  if (fullColumn) {
    // Column remains constant, rows span all lowercase (a-z)
    sc = fromAlphaUpper(node.start);
    ec = sc;
    sr = fromAlphaLower("a");
    er = fromAlphaLower("z");
  } else if (fullRow) {
    // Row remains constant, columns span all uppercase (A-Z)
    sr = fromAlphaLower(node.start);
    er = sr;
    sc = fromAlphaUpper("A");
    ec = fromAlphaUpper("Z");
  } else {
    // Standard range A1:B2, a:b etc.
    const [scParsed, srParsed] = parseCellId(node.start);
    const [ecParsed, erParsed] = parseCellId(node.end);
    sc = scParsed;
    sr = srParsed;
    ec = ecParsed;
    er = erParsed;
  }

  const out: number[] = [];

  for (let c = sc; c <= ec; c++) {
    for (let r = sr; r <= er; r++) {
      const idx = getCellIdx(c, r);
      const cell = sheet[idx];
      if (cell) {
        const val = evaluateFormula(cell.text, targetSheet, sheets);
        out.push(val);
      }
    }
  }
  return out;
}

export function stringify(node: ASTNode): string {
  switch (node.type) {
    case "number":
      return node.value.toString();
    case "cell": {
      const [c, r] = parseCellId(node.id);
      return (
        (node.sheet ? `${node.sheet}!` : "") + toAlphaUpper(c) + toAlphaLower(r)
      );
    }
    case "range": {
      const start = node.start;
      const end = node.end;
      return `${node.sheet ? `${node.sheet}!` : ""}${start}:${end}`;
    }
    case "binary":
      return `${stringify(node.left)}${node.op}${stringify(node.right)}`;
    case "func":
      return `${node.name}(${node.args.map(stringify).join(",")})`;
  }
}

export function shiftAST(
  node: ASTNode,
  isRow: boolean,
  insertAt: number,
): ASTNode {
  const shiftCoord = (id: string): string => {
    const [c0, r0] = parseCellId(id);
    const c =
      isRow && r0 >= insertAt ? c0 : !isRow && c0 >= insertAt ? c0 + 1 : c0;
    const r =
      isRow && r0 >= insertAt ? r0 + 1 : !isRow && c0 >= insertAt ? r0 : r0;
    return toAlphaUpper(c) + toAlphaLower(r);
  };

  switch (node.type) {
    case "cell":
      return {
        ...node,
        id: shiftCoord(node.id),
      };
    case "range":
      return {
        ...node,
        start: shiftCoord(node.start),
        end: shiftCoord(node.end),
      };
    case "binary":
      return {
        type: "binary",
        op: node.op,
        left: shiftAST(node.left, isRow, insertAt),
        right: shiftAST(node.right, isRow, insertAt),
      };
    case "func":
      return {
        type: "func",
        name: node.name,
        args: node.args.map((arg) => shiftAST(arg, isRow, insertAt)),
      };
    default:
      return node; // number
  }
}

function parseCellId(id: string): [number, number] {
  const m = id.match(/^([A-Z]+)([a-z]+)$/);
  if (!m) throw new Error(`Invalid cell ID: ${id}`);
  return [fromAlphaUpper(m[1]), fromAlphaLower(m[2])];
}
