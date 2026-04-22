import fs from "fs";
import { db } from "../lib/db";
import { generateColor } from "../utils/generateColor";

export async function importCategoriesCsv(filePath: string) {
  const rows = fs.readFileSync(filePath, "utf8").split("\n");

  // Skip header
  rows.shift();

  const stmt = db.prepare(`
    INSERT INTO categories (id, user_id, name, type, color)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const row of rows) {
    if (!row.trim()) continue; // ⭐ skip lege regels

    const parts = row.split(",");

    if (parts.length < 4) {
      console.log("⚠️ Skipping invalid row:", row);
      continue; // ⭐ skip incomplete regels
    }

    const [id, userId, name, type] = parts.map((p) => p?.trim() ?? "");

    if (!id || !userId || !name || !type) {
      console.log("⚠️ Skipping row with missing fields:", row);
      continue; // ⭐ skip regels met lege velden
    }

    stmt.run(Number(id), userId, name, type, generateColor());
  }

  console.log("✅ Categories imported with colors");
}
