import fs from "fs";
import { parseCsv } from "./csv.parser";
import { pool } from "../lib/db";
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

  for (const row of rows) {
    const normalized = CATEGORY_MAP[row.category_name];

    if (!normalized) {
      throw new Error(`Unknown category in CSV: ${row.category_name}`);
    }

    const categoryId = await findCategoryIdByName(normalized);

    if (!categoryId) {
      throw new Error(`Category not found in DB: ${normalized}`);
    }

    await pool.query(
      `
      INSERT INTO budget_categories (month, category_id, budget_amount)
      VALUES ($1, $2, $3)
      `,
      [row.month, categoryId, Number(row.budget_amount)],
    );
  }

  console.log("Budget categories imported:", rows.length);
}
