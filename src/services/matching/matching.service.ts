import { pool } from "../../lib/db";
import { similarity } from "./string.utils";
import { dateRange } from "./date.utils";
import { amountCloseEnough } from "./amount.utils";
import { normalizeMerchant } from "../../../../shared/services/normalizeMerchant";
import {
  MatchInput,
  MatchResult,
  MatchDuplicate,
  MatchAiResult,
  MatchCandidate,
} from "../../shared/types/matching";

export const matchingService = {
  async findMatch(input: MatchInput, userId: string): Promise<MatchResult> {
    const { receiptId, amount, date, merchant, transaction_date } = input;

    // ------------------------------------------------------------
    // Normalize merchant + amount
    // ------------------------------------------------------------
    const normMerchant = normalizeMerchant(merchant ?? "");
    const normalizedAmount = Math.abs(amount);

    // Gebruik transaction_date als primaire datum
    const baseDate = transaction_date ?? date ?? "";

    console.log("🔍 [MATCH v2] Starting match for:", {
      receiptId,
      amount,
      normalizedAmount,
      date,
      transaction_date,
      merchant,
      canonicalKey: normMerchant.key,
      displayName: normMerchant.display,
      baseDate,
    });

    // ------------------------------------------------------------
    // 1. DUPLICATE CHECK (exact match)
    // ------------------------------------------------------------
    const duplicateResult = await pool.query(
      `
      SELECT id, amount, transaction_date AS date, merchant
      FROM transactions
      WHERE ABS(amount) = $1
        AND DATE(transaction_date) = DATE($2)
        AND merchant = $3
        AND user_id = $4
        AND receipt_id IS NULL
      `,
      [normalizedAmount, baseDate, normMerchant.key, userId],
    );

    const duplicate = duplicateResult.rows[0] as MatchDuplicate | undefined;

    if (duplicate) {
      console.log("🔁 [MATCH v2] Exact duplicate found:", duplicate);

      return {
        action: "duplicate",
        duplicate,
        aiMatch: null,
        candidates: [],
        summary: `Exact duplicate found for merchant "${duplicate.merchant}" on ${duplicate.date}`,
      };
    }

    // ------------------------------------------------------------
    // 2. AI MATCH (fuzzy + tolerances)
    // ------------------------------------------------------------
    const dates = dateRange(baseDate, 2);

    // Build placeholders for dates ($1, $2, $3...)
    const datePlaceholders = dates.map((_, i) => `$${i + 1}`).join(",");

    const rowsResult = await pool.query(
      `
      SELECT 
        id,
        amount,
        transaction_date AS date,
        merchant
      FROM transactions
      WHERE DATE(transaction_date) IN (${datePlaceholders})
        AND user_id = $${dates.length + 1}
        AND receipt_id IS NULL
      `,
      [...dates, userId],
    );

    const rows = rowsResult.rows as Array<{
      id: number;
      amount: number;
      date: string;
      merchant: string;
    }>;

    let best: MatchAiResult | null = null;
    let bestScore = 0;

    const candidates: MatchCandidate[] = [];

    for (const row of rows) {
      const rowNormMerchant = normalizeMerchant(row.merchant);

      // Amount tolerance
      if (!amountCloseEnough(normalizedAmount, Math.abs(row.amount))) continue;

      // Fuzzy merchant similarity (canonical keys)
      const score = similarity(normMerchant.key, rowNormMerchant.key); // FIXED

      if (score >= 0.4) {
        candidates.push({
          id: row.id,
          amount: row.amount,
          date: row.date,
          merchant: row.merchant,
          score,
        });
      }

      if (score > bestScore) {
        bestScore = score;
        best = {
          id: row.id,
          amount: row.amount,
          date: row.date,
          merchant: row.merchant,
        };
      }
    }

    // High‑confidence AI match
    if (best && bestScore >= 0.75) {
      console.log("🤖 [MATCH v2] High-confidence AI match:", {
        best,
        score: bestScore,
      });

      return {
        action: "aiMatch",
        duplicate: null,
        aiMatch: best,
        candidates: [],
        summary: `AI match found with confidence ${bestScore.toFixed(2)}`,
      };
    }

    // ------------------------------------------------------------
    // 3. MULTIPLE CANDIDATES (low confidence)
    // ------------------------------------------------------------
    if (candidates.length > 0) {
      console.log("🧩 [MATCH v2] Multiple candidates found:", candidates);

      return {
        action: "candidates",
        duplicate: null,
        aiMatch: null,
        candidates,
        summary: `${candidates.length} possible matches found`,
      };
    }

    // ------------------------------------------------------------
    // 4. NO MATCH
    // ------------------------------------------------------------
    console.log("❌ [MATCH v2] No match found");

    return {
      action: "no-match",
      duplicate: null,
      aiMatch: null,
      candidates: [],
      summary: "No matching transactions found",
    };
  },
};
