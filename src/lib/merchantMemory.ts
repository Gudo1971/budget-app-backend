import { db } from "../lib/db";

export function getMerchantMemory(
  user_id: string,
  merchant: string
): { category: string; subcategory: string | null } | null {
  const row = db
    .prepare(
      `
      SELECT category, subcategory
      FROM merchant_memory
      WHERE user_id = ?
        AND LOWER(merchant) = LOWER(?)
    `
    )
    .get(user_id, merchant) as
    | { category: string; subcategory: string | null }
    | undefined;

  return row ?? null;
}

export function upsertMerchantMemory(
  user_id: string,
  merchant: string,
  category: string,
  subcategory: string | null
) {
  db.prepare(
    `
    INSERT INTO merchant_memory (user_id, merchant, category, subcategory, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category = excluded.category,
      subcategory = excluded.subcategory,
      updated_at = datetime('now')
  `
  ).run(user_id, merchant.toLowerCase(), category, subcategory);
}
