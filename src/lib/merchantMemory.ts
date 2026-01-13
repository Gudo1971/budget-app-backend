import { db } from "../lib/db";

export function getCategoryForMerchant(
  user_id: string,
  merchant: string
): number | null {
  const row = db
    .prepare(
      `
      SELECT category_id
      FROM merchant_memory
      WHERE user_id = ?
        AND LOWER(merchant) = LOWER(?)
    `
    )
    .get(user_id, merchant) as { category_id: number } | undefined;

  return row ? row.category_id : null;
}

export function upsertMerchantMemory(
  user_id: string,
  merchant: string,
  category_id: number
) {
  db.prepare(
    `
    INSERT INTO merchant_memory (user_id, merchant, category_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category_id = excluded.category_id,
      updated_at = datetime('now')
  `
  ).run(user_id, merchant.toLowerCase(), category_id);
}
