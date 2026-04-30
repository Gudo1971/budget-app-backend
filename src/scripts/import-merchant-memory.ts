import fs from "fs";
import path from "path";
import { pool } from "../lib/db";

export async function importMerchantMemoryCsv(userId: number) {
  const filePath = path.join(__dirname, "..", "data", "merchant_memory.csv");

  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ merchant_memory.csv not found, skipping import.");
    return;
  }

  console.log("📥 Importing merchant_memory.csv...");

  const file = fs.readFileSync(filePath, "utf8");
  const lines = file.split("\n").filter((l) => l.trim().length > 0);

  // ⭐ Drop table (Postgres)
  await pool.query(`DROP TABLE IF EXISTS merchant_memory`);

  // ⭐ Recreate table (Postgres)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS merchant_memory (
      user_id INTEGER NOT NULL,
      merchant TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
      PRIMARY KEY (user_id, merchant)
    );
  `);

  // ⭐ Insert with ON CONFLICT
  for (const line of lines.slice(1)) {
    const [merchant, category_id] = line.split(",");

    if (!merchant || !category_id) continue;

    await pool.query(
      `
      INSERT INTO merchant_memory (user_id, merchant, category_id, confidence)
      VALUES ($1, $2, $3, 1.0)
      ON CONFLICT (user_id, merchant)
      DO UPDATE SET category_id = EXCLUDED.category_id,
                    confidence = EXCLUDED.confidence
      `,
      [userId, merchant.trim().toLowerCase(), Number(category_id)],
    );
  }

  console.log("✅ merchant_memory.csv imported successfully");
}
