import { db } from "../../lib/db";
import { similarity } from "./string.utils";
import { dateRange } from "./date.utils";
import { amountCloseEnough } from "./amount.utils";

export const matchingService = {
  findMatch(amount: number, date: string, merchant: string, user_id: string) {
    // 1. Exacte match op bedrag + datum + merchant
    const exact = db
      .prepare(
        `
        SELECT id, merchant
        FROM transactions
        WHERE amount = ?
          AND DATE(transaction_date) = DATE(?)
          AND LOWER(merchant) = LOWER(?)
          AND user_id = ?
          AND receipt_id IS NULL
      `
      )
      .get(amount, date, merchant, user_id) as {
      id: number;
      merchant: string;
    } | null;

    if (exact?.id) {
      return { match: true, transaction_id: exact.id, confidence: 1.0 };
    }

    // 2. Zelfde bedrag (met tolerantie) + datum-tolerantie (±2 dagen) + fuzzy merchant
    const dates = dateRange(date, 2);

    const candidates = db
      .prepare(
        `
    SELECT id, merchant, amount, transaction_date
    FROM transactions
    WHERE DATE(transaction_date) IN (${dates.map(() => "?").join(",")})
      AND user_id = ?
      AND receipt_id IS NULL
  `
      )
      .all(...dates, user_id) as Array<{
      id: number;
      merchant: string;
      amount: number;
      transaction_date: string;
    }>;

    let bestMatch: { id: number; score: number } | null = null;

    for (const row of candidates) {
      // bedrag-tolerantie
      if (!amountCloseEnough(amount, row.amount)) continue;

      // fuzzy merchant
      const score = similarity(merchant, row.merchant);

      if (score >= 0.55) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { id: row.id, score };
        }
      }
    }

    if (bestMatch) {
      return {
        match: true,
        transaction_id: bestMatch.id,
        confidence: bestMatch.score,
      };
    }

    return { match: false };
  },

  linkReceiptToTransaction(receiptId: number, transactionId: number) {
    db.prepare(
      `
      UPDATE transactions
      SET receipt_id = ?
      WHERE id = ?
    `
    ).run(receiptId, transactionId);
  },
};
