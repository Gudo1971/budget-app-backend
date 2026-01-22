import fs from "fs";
import { parseCsv } from "./csv.parser";
import { db } from "../lib/db";

export async function importCategoriesCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  const stmt = db.prepare(`
    INSERT INTO categories (name, type)
    VALUES (?, ?)
  `);

  for (const row of rows) {
    stmt.run(row.name, row.type);
  }

  console.log("Categories imported:", rows.length);
}
