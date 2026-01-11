import { Router } from "express";
import { db } from "../../lib/db";
import { findMatchingTransaction } from "../../ai/matching/findMatchingTransaction";

const router = Router();
const USER_ID = "demo-user";

type ReceiptRecord = {
  id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
  user_id: string;
  ocrText?: string | null;
  aiResult?: string | null;
};

router.get("/:id/match", async (req, res) => {
  const { id } = req.params;

  const receipt = db
    .prepare(
      "SELECT id, filename, original_name, uploaded_at, ocrText, aiResult FROM receipts WHERE id = ? AND user_id = ?"
    )
    .get(id, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  let extracted: any = {};
  try {
    extracted = JSON.parse(receipt.aiResult ?? "{}");
  } catch {
    extracted = {};
  }

  const matchResult = await findMatchingTransaction({
    amount: extracted.total ?? 0,
    date: extracted.date ?? "",
    merchant: extracted.merchant ?? "",
  });

  res.json(matchResult);
});

export default router;
