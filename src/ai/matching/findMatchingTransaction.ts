import { normalizeMerchant } from "../helpers/normalizeMerchant";
import { similarity } from "../helpers/similarity";
import { db } from "../../lib/db";

import { Transaction } from "../../types/Transaction";
import { MatchInput, MatchResult } from "../../types/matching";

export async function findMatchingTransaction({
  receiptId,
  amount,
  date,
  merchant,
}: MatchInput): Promise<MatchResult> {
  const normalizedMerchant = normalizeMerchant(merchant);

  // Typed DB query
  const transactions = db
    .prepare(
      `
    SELECT 
      id,
      date,
      description,
      amount,
      merchant,
      receipt_id,
      category_id,
      category
    FROM transactions
    WHERE user_id = ?
    `,
    )
    .all("demo-user") as Transaction[];

  let bestDuplicate: Transaction | null = null;
  let bestAiMatch: Transaction | null = null;
  let candidates: Array<Transaction & { score: number }> = [];

  for (const tx of transactions) {
    const txMerchant = normalizeMerchant(tx.merchant);

    const amountDiff = Math.abs(tx.amount - amount);
    const dayDiff =
      Math.abs(new Date(tx.date).getTime() - new Date(date).getTime()) /
      (1000 * 60 * 60 * 24);
    const merchantSim = similarity(normalizedMerchant, txMerchant);

    // HARD FILTERS
    if (amountDiff > 1) continue;
    if (dayDiff > 2) continue;
    if (merchantSim < 0.6) continue;

    // SCORE
    let score = 0;

    // Amount scoring
    if (amountDiff <= 0.1) score += 60;
    else if (amountDiff <= 0.5) score += 40;
    else if (amountDiff <= 1) score += 20;

    // Date scoring
    if (dayDiff === 0) score += 30;
    else if (dayDiff <= 1) score += 20;
    else if (dayDiff <= 2) score += 10;

    // Merchant scoring
    if (merchantSim >= 0.9) score += 10;
    else if (merchantSim >= 0.8) score += 7;
    else if (merchantSim >= 0.6) score += 4;

    // CLASSIFY
    if (score >= 90) {
      bestDuplicate = tx;
      break;
    }

    if (score >= 70) {
      bestAiMatch = tx;
    }

    if (score >= 40) {
      candidates.push({ ...tx, score });
    }
  }

  // RETURN LOGIC
  if (bestDuplicate) {
    return {
      action: "duplicate",
      duplicate: bestDuplicate,
      aiMatch: null,
      candidates: [],
      summary: "100% match gevonden",
    };
  }

  if (bestAiMatch) {
    return {
      action: "aiMatch",
      aiMatch: bestAiMatch,
      duplicate: null,
      candidates: [],
      summary: "Waarschijnlijke match gevonden",
    };
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return {
      action: "candidates",
      candidates,
      duplicate: null,
      aiMatch: null,
      summary: "Mogelijke matches gevonden",
    };
  }

  return {
    action: "no-match",
    candidates: [],
    duplicate: null,
    aiMatch: null,
    summary: "Geen match gevonden",
  };
}
