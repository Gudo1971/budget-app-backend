import fs from "fs";
import { parseCsv } from "../scripts/csv.parser";
import { createBudget } from "../services/budgets/budget.service";

export async function importBudgetsCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    await createBudget({
      category: row.category,
      amount: Number(row.amount),
      period: row.period,
    });
  }

  console.log("Budgets imported:", rows.length);
}
