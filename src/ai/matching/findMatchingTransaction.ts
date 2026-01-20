import { normalizeMerchant } from "../helpers/normalizeMerchant";
import { similarity } from "../helpers/similarity";
import { db } from "../../lib/db";

import { Transaction } from "../../../../shared/types/Transaction";
import { MatchInput, MatchResult } from "../../../../shared/types/matching";

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

    // ⭐ NORMALIZE AMOUNTS - bon é sempre positivo, transação pode ser negativa
    const receiptAmount = Math.abs(amount);
    const txAmount = Math.abs(tx.amount);
    const amountDiff = Math.abs(receiptAmount - txAmount);

    const dayDiff =
      Math.abs(new Date(tx.date).getTime() - new Date(date).getTime()) /
      (1000 * 60 * 60 * 24);
    const merchantSim = similarity(normalizedMerchant, txMerchant);

    console.log(`🔍 Comparing with tx ${tx.id}:`, {
      merchant: tx.merchant,
      receiptAmount,
      txAmount,
      amountDiff,
      dayDiff,
      merchantSim,
    });

    // HARD FILTERS - MORE FLEXIBLE
    if (amountDiff > 1) continue; // Bedrag max 1 euro verschil
    // Date filter removed - bon kan geen datum hebben!
    if (merchantSim < 0.6) continue; // Merchant moet toch 60% match

    // SCORE
    let score = 0;

    // Amount scoring (MOST IMPORTANT)
    if (amountDiff <= 0.1) score += 60;
    else if (amountDiff <= 0.5) score += 40;
    else if (amountDiff <= 1) score += 20;

    // Date scoring (LESS IMPORTANT if receipt has no date)
    if (dayDiff === 0) score += 30;
    else if (dayDiff <= 1) score += 20;
    else if (dayDiff <= 3)
      score += 10; // ← MEER FLEXIBEL
    else if (dayDiff <= 7) score += 5; // ← WEEK TOLERANCE

    // Merchant scoring
    if (merchantSim >= 0.9) score += 10;
    else if (merchantSim >= 0.8) score += 7;
    else if (merchantSim >= 0.6) score += 4;

    console.log(`  -> Score: ${score}`);

    // CLASSIFY
    if (score >= 80) {
      // ← LOWERED from 90
      console.log(`✅ DUPLICATE FOUND (score: ${score})`);
      bestDuplicate = tx;
      break;
    }

    if (score >= 60) {
      // ← LOWERED from 70
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
