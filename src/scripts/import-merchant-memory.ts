import fs from "fs";
import path from "path";
import { pool } from "../lib/db";

export async function importMerchantMemoryCsv(userId: string) {
  const filePath = path.join(__dirname, "..", "data", "merchant_memory.csv");

  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ merchant_memory.csv not found, skipping import.");
    return;
  }

  console.log("📥 Importing merchant_memory.csv...");

  const file = fs.readFileSync(filePath, "utf8");
  const lines = file.split("\n").filter((l) => l.trim().length > 0);

  // ⚠️ NIET drop/recreate - tabel bestaat al via init-db-function.ts
  // We voegen alleen data toe

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
