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
  merchant_raw,
  transaction_date,
}: MatchInput): Promise<MatchResult> {
  // ⭐ Input normalisatie
  const inputMerchant = normalizeMerchant(merchant_raw ?? merchant);

  // ⭐ Datum veilig bepalen
  const inputDate = transaction_date ?? date ?? "";
  const parsedInputDate = new Date(inputDate);

  const inputAmount = Math.abs(amount);

  // ⭐ Typed DB query
  const transactions = db
    .prepare(
      `
    SELECT 
      id,
      date,
      transaction_date,
      description,
      amount,
      merchant,
      merchant_raw,
      receipt_id,
      category_id,
      category,
      subcategory,
      subcategory_id
    FROM transactions
    WHERE user_id = ?
    `,
    )
    .all("demo-user") as Array<Transaction>;

  let bestDuplicate: Transaction | null = null;
  let bestAiMatch: Transaction | null = null;
  let candidates: Array<Transaction & { score: number }> = [];

  for (const tx of transactions) {
    const txMerchant = normalizeMerchant(tx.merchant_raw ?? tx.merchant);

    const txAmount = Math.abs(tx.amount);
    const amountDiff = Math.abs(inputAmount - txAmount);

    const txDate = tx.transaction_date ?? tx.date;
    const dayDiff =
      Math.abs(new Date(txDate).getTime() - parsedInputDate.getTime()) /
      (1000 * 60 * 60 * 24);

    const merchantSim = similarity(inputMerchant, txMerchant);

    console.log(`🔍 Comparing with tx ${tx.id}:`, {
      merchant_raw: tx.merchant_raw,
      merchant: tx.merchant,
      txMerchant,
      inputMerchant,
      inputAmount,
      txAmount,
      amountDiff,
      dayDiff,
      merchantSim,
    });

    if (amountDiff > 1) continue;
    if (merchantSim < 0.5) continue;

    let score = 0;

    if (amountDiff <= 0.1) score += 60;
    else if (amountDiff <= 0.5) score += 40;
    else if (amountDiff <= 1) score += 20;

    if (dayDiff === 0) score += 30;
    else if (dayDiff <= 1) score += 20;
    else if (dayDiff <= 3) score += 10;
    else if (dayDiff <= 7) score += 5;

    if (merchantSim >= 0.9) score += 10;
    else if (merchantSim >= 0.8) score += 7;
    else if (merchantSim >= 0.6) score += 4;

    console.log(`  -> Score: ${score}`);

    if (score >= 85) {
      bestDuplicate = tx;
      break;
    }

    if (score >= 65) {
      bestAiMatch = tx;
    }

    if (score >= 40) {
      candidates.push({ ...tx, score });
    }
  }

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
