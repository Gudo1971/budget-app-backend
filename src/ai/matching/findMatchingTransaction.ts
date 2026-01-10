import { db } from "../../lib/db";
import levenshtein from "fast-levenshtein";

type TransactionRow = {
  id: number;
  amount: number;
  date: string;
  merchant: string | null;
};

export async function findMatchingTransaction({
  amount,
  date,
  merchant,
}: {
  amount: number;
  date: string;
  merchant: string;
}) {
  // 1. Haal alle transacties op
  const transactions = db
    .prepare(
      `
      SELECT id, amount, date, merchant
      FROM transactions
      WHERE user_id = ?
    `
    )
    .all("demo-user") as TransactionRow[];

  let bestMatch: TransactionRow | null = null;
  let bestScore = 0;

  for (const tx of transactions) {
    let score = 0;

    // -----------------------------
    // A. Amount score (max 60)
    // -----------------------------
    const diff = Math.abs(tx.amount - amount);

    if (diff === 0) score += 60;
    else if (diff <= 0.5) score += 40;
    else if (diff <= 1) score += 20;

    // -----------------------------
    // B. Date score (max 30)
    // -----------------------------
    const txDate = new Date(tx.date);
    const receiptDate = new Date(date);
    const dayDiff =
      Math.abs(txDate.getTime() - receiptDate.getTime()) /
      (1000 * 60 * 60 * 24);

    if (dayDiff === 0) score += 30;
    else if (dayDiff <= 1) score += 20;
    else if (dayDiff <= 2) score += 10;

    // -----------------------------
    // C. Merchant score (max 10)
    // -----------------------------
    if (tx.merchant && merchant) {
      const distance = levenshtein.get(
        tx.merchant.toLowerCase(),
        merchant.toLowerCase()
      );
      const maxLen = Math.max(tx.merchant.length, merchant.length);
      const similarity = 1 - distance / maxLen;

      if (similarity === 1) score += 10;
      else if (similarity >= 0.8) score += 5;
    }

    // -----------------------------
    // D. Beste match bijhouden
    // -----------------------------
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tx;
    }
  }

  // -----------------------------
  // Confidence bepalen
  // -----------------------------
  let confidence: "high" | "medium" | "low" = "low";

  if (bestScore >= 70) confidence = "high";
  else if (bestScore >= 40) confidence = "medium";

  return {
    match: bestMatch,
    score: bestScore,
    confidence,
  };
}
