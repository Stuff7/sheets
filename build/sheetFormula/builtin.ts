

import type { EvalResult } from "./evaluator";

const flatten = (arg: EvalResult): number[] =>
  Array.isArray(arg) ? arg : [arg];

export const FUNCTIONS: Record<string, (args: EvalResult[]) => number> = {
  SUM: (args) => args.flatMap(flatten).reduce((sum, v) => sum + v, 0),

  AVERAGE: (args) => {
    const all = args.flatMap(flatten);
    if (all.length === 0) throw new Error("AVERAGE: no values");
    return all.reduce((sum, v) => sum + v, 0) / all.length;
  },

  MIN: (args) => {
    const all = args.flatMap(flatten);
    if (all.length === 0) throw new Error("MIN: no values");
    return Math.min(...all);
  },

  MAX: (args) => {
    const all = args.flatMap(flatten);
    if (all.length === 0) throw new Error("MAX: no values");
    return Math.max(...all);
  },

  COUNT: (args) =>
    args.flatMap(flatten).filter((v) => typeof v === "number").length,
};
