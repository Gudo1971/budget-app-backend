import fs from "fs";
import { parseCsv } from "./csv.parser";
import { db } from "../lib/db";
import { findCategoryIdByName } from "../services/categories/category.service";

const CATEGORY_MAP: Record<string, string> = {
  Boodschappen: "Boodschappen",
  Horeca: "Horeca",
  Vervoer: "Vervoer",
  Abonnementen: "Abonnementen",
  Woonkosten: "Woonkosten",

  // oude normalisaties
  "Uit eten": "Horeca",
  Huur: "Woonkosten",
  Energie: "Woonkosten",
};

export async function importBudgetCategoriesCsv(path: string) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  const stmt = db.prepare(`
    INSERT INTO budget_categories (month, category_id, budget_amount)
    VALUES (?, ?, ?)
  `);

  for (const row of rows) {
    const normalized = CATEGORY_MAP[row.category_name];

    if (!normalized) {
      throw new Error(`Unknown category in CSV: ${row.category_name}`);
    }

    const categoryId = findCategoryIdByName(normalized);

    if (!categoryId) {
      throw new Error(`Category not found in DB: ${normalized}`);
    }

    stmt.run(row.month, categoryId, Number(row.budget_amount));
  }

  console.log("Budget categories imported:", rows.length);
}
