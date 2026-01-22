import { db } from "../../../lib/db";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";

export function getCategoryForMerchant(
  userId: string,
  merchant: string,
): { category_id: number; confidence: number } | null {
  const norm = normalizeMerchant(merchant).key; // FIXED

  const row = db
    .prepare(
      `
      SELECT category_id, confidence
      FROM merchant_memory
      WHERE user_id = ?
        AND merchant = ?
    `,
    )
    .get(userId, norm) as { category_id: number; confidence: number } | null;

  return row ?? null;
}

export function upsertMerchantMemory(
  userId: string,
  merchant: string,
  categoryId: number,
) {
  const norm = normalizeMerchant(merchant).key; // FIXED

  const existing = db
    .prepare(
      `
      SELECT category_id, confidence
      FROM merchant_memory
      WHERE user_id = ?
        AND merchant = ?
    `,
    )
    .get(userId, norm) as { category_id: number; confidence: number } | null;

  if (!existing) {
    db.prepare(
      `
      INSERT INTO merchant_memory (user_id, merchant, category_id, confidence)
      VALUES (?, ?, ?, ?)
    `,
    ).run(userId, norm, categoryId, 1.0);

    return;
  }

  let newConfidence = existing.confidence;

  if (existing.category_id === categoryId) {
    newConfidence = Math.min(1.0, existing.confidence + 0.1);
  } else {
    newConfidence = Math.max(0.0, existing.confidence - 0.3);
  }

  db.prepare(
    `
    UPDATE merchant_memory
    SET category_id = ?, confidence = ?
    WHERE user_id = ? AND merchant = ?
  `,
  ).run(categoryId, newConfidence, userId, norm);
}
