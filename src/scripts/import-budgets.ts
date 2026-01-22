import fs from "fs";
import { parseCsv } from "../scripts/csv.parser";
import { db } from "../lib/db";

export async function importBudgetsCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  const stmt = db.prepare(`
    INSERT INTO budgets (month, total_budget)
    VALUES (?, ?)
  `);

  for (const row of rows) {
    stmt.run(row.month, Number(row.total_budget));
  }

  console.log("Budgets imported:", rows.length);
}
