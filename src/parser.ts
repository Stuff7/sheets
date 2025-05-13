import { watchFn } from "jsx";
import { evaluateFormula, type Spreadsheet } from "./sheetFormula/evaluator";
import { currentSheet } from "./state";

watchFn(
  () => currentSheet().textCells(),
  () => {
    const sheet: Spreadsheet = currentSheet().textCells();
    for (const value of Object.values(sheet)) {
      let formula: string;
      let result: string | number;
      if (value[0] === "=") {
        formula = value.slice(1);
        result = evaluateFormula(formula, sheet);
      } else {
        formula = value;
        result = value;
      }

      console.log(`${formula} = ${result}`);
    }
  },
);
