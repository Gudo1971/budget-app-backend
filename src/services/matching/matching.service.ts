import { db } from "../../lib/db";
import { similarity } from "./string.utils";
import { dateRange } from "./date.utils";
import { amountCloseEnough } from "./amount.utils";
import { normalizeMerchant } from "../../utils/merchant";
import {
  MatchInput,
  MatchResult,
  MatchDuplicate,
  MatchAiResult,
  MatchCandidate,
} from "../../../../shared/types/matching";

export const matchingService = {
  findMatch(input: MatchInput, userId: string): MatchResult {
    const { receiptId, amount, date, merchant } = input;

    // Normalize merchant + amount
    const normMerchant = normalizeMerchant(merchant);
    const normalizedAmount = Math.abs(amount);

    console.log("🔍 [MATCH v2] Starting match for:", {
      receiptId,
      amount,
      normalizedAmount,
      date,
      merchant,
      normMerchant,
    });

    // ------------------------------------------------------------
    // 1. DUPLICATE CHECK (exact match with normalized merchant)
    // ------------------------------------------------------------
    const duplicate = db
      .prepare(
        `
        SELECT id, amount, transaction_date AS date, merchant
        FROM transactions
        WHERE ABS(amount) = ?
          AND DATE(transaction_date) = DATE(?)
          AND merchant = ?
          AND user_id = ?
          AND receipt_id IS NULL
      `,
      )
      .get(
        normalizedAmount,
        date,
        normMerchant,
        userId,
      ) as MatchDuplicate | null;

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
    const dates = dateRange(date, 2);

    const rows = db
      .prepare(
        `
        SELECT 
          id,
          amount,
          transaction_date AS date,
          merchant
        FROM transactions
        WHERE DATE(transaction_date) IN (${dates.map(() => "?").join(",")})
          AND user_id = ?
          AND receipt_id IS NULL
      `,
      )
      .all(...dates, userId) as Array<{
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

      // Fuzzy merchant similarity
      const score = similarity(normMerchant, rowNormMerchant);

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
