import fs from "fs";
import { parseCsv } from "../scripts/csv.parser";
import { pool } from "../lib/db";

export async function importBudgetsCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    await pool.query(
      `
      INSERT INTO budgets (month, total_budget)
      VALUES ($1, $2)
      `,
      [row.month, Number(row.total_budget)],
    );
  }

  console.log("Budgets imported:", rows.length);
}
