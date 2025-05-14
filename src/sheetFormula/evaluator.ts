import { Parser, type ASTNode } from "./parser";
import { getCellIdx, fromAlphaUpper, fromAlphaLower } from "../utils";
import type { TextMap } from "~/types";

/**
 * Evaluate a formula: ranges yield number[], functions decide how to handle arrays.
 */
export function evaluateFormula(formula: string, sheet: TextMap): number {
  const ast = new Parser(formula).parseExpression();
  const result = evaluate(ast, sheet);
  if (typeof result === "number") return result;
  throw new Error(`Formula did not evaluate to a single number: ${formula}`);
}

// Internal eval can return either number or number[]
type EvalResult = number | number[];

/**
 * Recursively evaluate AST. Ranges => number[].
 */
function evaluate(node: ASTNode, sheet: TextMap): EvalResult {
  switch (node.type) {
    case "number":
      return node.value;

    case "cell": {
      const [c, r] = parseCellId(node.id);
      const idx = getCellIdx(c, r);
      const cell = sheet[idx];
      if (!cell) throw new Error(`Cell ${node.id} not found`);
      return evaluateFormula(cell.text, sheet);
    }

    case "range":
      return flattenRange(node, sheet);

    case "binary": {
      const L = evaluate(node.left, sheet);
      const R = evaluate(node.right, sheet);
      if (Array.isArray(L) || Array.isArray(R)) {
        throw new Error("Cannot use + - * / on arrays");
      }
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
      // Raw args may be numbers or arrays
      const rawArgs = node.args.map((arg) => evaluate(arg, sheet));
      switch (node.name) {
        case "SUM":
          return rawArgs.reduce<number>(
            (total, a) =>
              total + (Array.isArray(a) ? a.reduce((t, v) => t + v, 0) : a),
            0,
          );
        default:
          throw new Error(`Unknown function: ${node.name}`);
      }
    }
  }
}

/** Helper: convert Range AST into an array of cell values */
function flattenRange(
  node: { start: string; end: string },
  sheet: TextMap,
): number[] {
  const [sc, sr] = parseCellId(node.start);
  const [ec, er] = parseCellId(node.end);
  const out: number[] = [];

  for (let c = sc; c <= ec; c++) {
    for (let r = sr; r <= er; r++) {
      const idx = getCellIdx(c, r);
      const cell = sheet[idx];
      if (cell) {
        const val = evaluateFormula(cell.text, sheet);
        out.push(val);
      }
    }
  }
  return out;
}

function parseCellId(id: string): [number, number] {
  const m = id.match(/^([A-Z]+)([a-z]+)$/);
  if (!m) throw new Error(`Invalid cell ID: ${id}`);
  return [fromAlphaUpper(m[1]), fromAlphaLower(m[2])];
}
