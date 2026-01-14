import fs from "fs";
import { parseCsv } from "../scripts/csv.parser";
import { findOrCreateCategory } from "../services/categories/category.service";

export async function importCategoriesCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    await findOrCreateCategory(row.name);
  }

  console.log("Categories imported:", rows.length);
}
