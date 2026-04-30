import { pool } from "../../../lib/db";
import { normalizeMerchant } from "../../../../../shared/services/normalizeMerchant";

export async function getCategoryForMerchant(
  userId: string,
  merchant: string,
): Promise<{ category_id: number; confidence: number } | null> {
  const norm = normalizeMerchant(merchant).key;

  const result = await pool.query(
    `
    SELECT category_id, confidence
    FROM merchant_memory
    WHERE user_id = $1
      AND merchant = $2
    `,
    [userId, norm],
  );

  return result.rows[0] ?? null;
}

export async function upsertMerchantMemory(
  userId: string,
  merchant: string,
  categoryId: number,
) {
  const norm = normalizeMerchant(merchant).key;

  // 1. Check existing
  const existingResult = await pool.query(
    `
    SELECT category_id, confidence
    FROM merchant_memory
    WHERE user_id = $1
      AND merchant = $2
    `,
    [userId, norm],
  );

  const existing = existingResult.rows[0] as
    | { category_id: number; confidence: number }
    | undefined;

  // 2. Insert if not exists
  if (!existing) {
    await pool.query(
      `
      INSERT INTO merchant_memory (user_id, merchant, category_id, confidence)
      VALUES ($1, $2, $3, 1.0)
      ON CONFLICT (user_id, merchant)
      DO UPDATE SET category_id = EXCLUDED.category_id,
                    confidence = EXCLUDED.confidence
      `,
      [userId, norm, categoryId],
    );
    return;
  }

  // 3. Update confidence
  let newConfidence = existing.confidence;

  if (existing.category_id === categoryId) {
    newConfidence = Math.min(1.0, existing.confidence + 0.1);
  } else {
    newConfidence = Math.max(0.0, existing.confidence - 0.3);
  }

  await pool.query(
    `
    UPDATE merchant_memory
    SET category_id = $1,
        confidence = $2
    WHERE user_id = $3
      AND merchant = $4
    `,
    [categoryId, newConfidence, userId, norm],
  );
}
