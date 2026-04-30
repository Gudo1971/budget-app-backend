import fs from "fs";
import path from "path";
import { pool } from "../lib/db";

export async function importSubcategoriesCsv(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter(Boolean);

  // Skip header
  for (const line of lines.slice(1)) {
    const [category_id, name, user_id] = line.split(",");

    if (!category_id || !name || !user_id) {
      console.log("⚠️ Skipping invalid row:", line);
      continue;
    }

    await pool.query(
      `
      INSERT INTO subcategories (category_id, name, user_id)
      VALUES ($1, $2, $3)
      `,
      [Number(category_id), name.trim(), user_id.trim()],
    );
  }

  console.log("Imported subcategories.csv");
}
