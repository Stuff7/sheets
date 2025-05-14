import { watchFn } from "jsx";
import { evaluateFormula } from "./sheetFormula/evaluator";
import { currentSheet } from "./state";
import type { TextMap } from "./types";

watchFn(
  () => currentSheet().textCells(),
  () => {
    const sheet: TextMap = currentSheet().textCells();
    for (const value of Object.values(sheet)) {
      let formula: string;
      let result: string | number;
      if (value.text[0] === "=") {
        formula = value.text.slice(1);
        result = evaluateFormula(formula, sheet);
      } else {
        formula = value.text;
        result = value.text;
      }

      console.log(`${formula} = ${result}`);
    }
  },
);
