import { db } from "../../lib/db";
import { normalizeMerchant } from "../../utils/merchant";

export function getCategoryForMerchant(
  user_id: string,
  merchant: string,
): number | null {
  const norm = normalizeMerchant(merchant);

  const row = db
    .prepare(
      `
      SELECT category_id
      FROM merchant_memory
      WHERE user_id = ?
        AND merchant = ?
    `,
    )
    .get(user_id, norm) as { category_id: number } | null;

  return row?.category_id ?? null;
}

export function upsertMerchantMemory(
  user_id: string,
  merchant: string,
  category_id: number,
) {
  const norm = normalizeMerchant(merchant);

  db.prepare(
    `
    INSERT INTO merchant_memory (user_id, merchant, category_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category_id = excluded.category_id,
      updated_at = datetime('now')
  `,
  ).run(user_id, norm, category_id);
}
