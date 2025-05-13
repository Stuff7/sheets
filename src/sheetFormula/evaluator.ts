import { Parser, type ASTNode } from "./parser";
import { getCellIdx, fromAlphaUpper, fromAlphaLower } from "../utils";

export type Spreadsheet = Record<number, string>;

/**
 * Evaluate a formula: ranges yield number[], functions decide how to handle arrays.
 */
export function evaluateFormula(formula: string, sheet: Spreadsheet): number {
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
function evaluate(node: ASTNode, sheet: Spreadsheet): EvalResult {
  switch (node.type) {
    case "number":
      return node.value;

    case "cell": {
      const [c, r] = parseCellId(node.id);
      const idx = getCellIdx(c, r);
      const f = sheet[idx];
      if (f === undefined) throw new Error(`Cell ${node.id} not found`);
      return evaluateFormula(f, sheet);
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
        case "SUM": {
          // flatten numbers and arrays, then sum
          return rawArgs.reduce<number>((total, a) => {
            if (Array.isArray(a)) return total + a.reduce((t, v) => t + v, 0);
            return total + a;
          }, 0);
        }
        // future functions can introspect rawArgs
        default:
          throw new Error(`Unknown function: ${node.name}`);
      }
    }
  }
}

/** Helper: convert Range AST into an array of cell values */
function flattenRange(
  node: { start: string; end: string },
  sheet: Spreadsheet,
): number[] {
  const [sc, sr] = parseCellId(node.start);
  const [ec, er] = parseCellId(node.end);
  const out: number[] = [];

  for (let c = sc; c <= ec; c++) {
    for (let r = sr; r <= er; r++) {
      const idx = getCellIdx(c, r);
      const f = sheet[idx];
      if (f !== undefined) {
        const val = evaluateFormula(f, sheet);
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
