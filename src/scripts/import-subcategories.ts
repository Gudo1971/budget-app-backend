import fs from "fs";
import { db } from "../lib/db";

export async function importSubcategoriesCsv(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter(Boolean);

  for (const line of lines.slice(1)) {
    const [category_id, name, user_id] = line.split(",");

    db.prepare(
      `INSERT INTO subcategories (category_id, name, user_id)
       VALUES (?, ?, ?)`,
    ).run(Number(category_id), name.trim(), user_id.trim());
  }

  console.log("Imported subcategories.csv");
}
