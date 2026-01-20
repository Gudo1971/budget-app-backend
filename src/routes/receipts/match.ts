import { Router } from "express";
import { db } from "../../lib/db";
import { findMatchingTransaction } from "../../ai/matching/findMatchingTransaction";
import { MatchResult } from "../../../../shared/types/matching";

const router = Router();
const USER_ID = "demo-user";

type ReceiptRecord = {
  id: number;
  aiResult?: string | null;
};

router.get("/:id/match", async (req, res) => {
  const receiptId = Number(req.params.id);

  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt ID" });
  }

  // 1. RECEIPT OPHALEN
  const receipt = db
    .prepare(
      `
      SELECT id, aiResult
      FROM receipts
      WHERE id = ? AND user_id = ?
      `,
    )
    .get(receiptId, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  // 2. AI RESULT PARSEN
  let extracted: any = {};
  try {
    extracted = JSON.parse(receipt.aiResult ?? "{}");
  } catch {
    extracted = {};
  }

  console.log("🔍 MATCH DEBUG - aiResult from DB:", receipt.aiResult);
  console.log("🔍 MATCH DEBUG - Parsed extracted:", extracted);

  // 3. VALIDATIE — AI RESULT MOET BESTAAN (maar date kan null zijn)
  if (!extracted.total || !extracted.merchant) {
    console.log("❌ VALIDATION FAILED:", {
      hasTotal: !!extracted.total,
      hasMerchant: !!extracted.merchant,
    });
    return res.status(400).json({
      error: "Receipt has no merchant or total. AI analysis may have failed.",
    });
  }

  // ⭐ ALS GEEN DATE: GEBRUIK VANDAAG
  if (!extracted.date) {
    console.log("⚠️  No date on receipt, using today's date");
    extracted.date = new Date().toISOString().split("T")[0];
  }

  // 4. MATCHING ENGINE
  const matchResult = (await findMatchingTransaction({
    receiptId: receipt.id,
    amount: extracted.total,
    date: extracted.date,
    merchant: extracted.merchant,
  })) as MatchResult;

  // 5. TERUGSTUREN — DIRECT HET MATCHRESULT
  return res.json(matchResult);
});

export default router;
