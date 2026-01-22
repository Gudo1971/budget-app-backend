import fs from "fs";
import { parseCsv } from "../scripts/csv.parser";
import { createFixedCost } from "../services/pdf/fixed-costs/fixedCost.service";

export async function importFixedCostsCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    await createFixedCost({
      name: row.name,
      amount: Number(row.amount),
      interval: row.interval,
    });
  }

  console.log("Fixed costs imported:", rows.length);
}
