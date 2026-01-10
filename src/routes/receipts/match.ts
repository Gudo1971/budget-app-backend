import { Router } from "express";
import { db } from "../../lib/db";
import { findMatchingTransaction } from "../../ai/matching/findMatchingTransaction";

const router = Router();

type ReceiptRow = {
  id: number;
  merchant: string | null;
  amount: number;
  date: string;
};

router.get("/:id/match", async (req, res) => {
  const receiptId = req.params.id;

  const receipt = db
    .prepare(`SELECT id, merchant, amount, date FROM receipts WHERE id = ?`)
    .get(receiptId) as ReceiptRow | undefined;

  if (!receipt) return res.status(404).json({ error: "Receipt not found" });

  const matchResult = await findMatchingTransaction({
    amount: receipt.amount,
    date: receipt.date,
    merchant: receipt.merchant ?? "",
  });

  const { match, score, confidence } = matchResult;

  let message = "";
  let action = "";

  if (confidence === "high" && match) {
    message = `Ik heb een transactie gevonden die vrijwel zeker bij deze bon hoort. Wil je deze bon koppelen aan transactie ${match.id}?`;
    action = "suggest_link_existing";
  } else if (confidence === "medium" && match) {
    message = `Ik heb een mogelijke match gevonden. Klopt het dat deze bon hoort bij transactie ${match.id}?`;
    action = "confirm_possible_match";
  } else {
    message = `Ik heb geen bestaande transactie gevonden die bij deze bon hoort. Wil je een nieuwe transactie aanmaken en deze bon daaraan koppelen?`;
    action = "suggest_create_new";
  }

  res.json({ receipt, match, score, confidence, message, action });
});

export default router;
