import { Router } from "express";
import { db } from "../../lib/db";
import { categorizeTransaction } from "../../categorization/categorizeTransaction";
import { CategorizeInput, CategorizeOutput } from "../../types/categorization";
import { Transaction } from "../../types/Transaction";

const router = Router();

router.post("/:id", async (req, res) => {
  const txId = Number(req.params.id);
  const USER_ID = req.body.userId || "demo-user";

  // 1. Haal transactie op
  const tx = db
    .prepare(
      `SELECT id, amount, date, merchant, description
       FROM transactions
       WHERE id = ? AND user_id = ?`,
    )
    .get(txId, USER_ID) as Transaction | undefined;

  if (!tx) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  // 2. Bouw categorisatie-input
  const input: CategorizeInput = {
    userId: USER_ID,
    merchantName: tx.merchant,
    description: tx.description ?? tx.merchant,
    amount: tx.amount,
    date: tx.date,
  };

  // 3. Categoriseer
  const result: CategorizeOutput = await categorizeTransaction(input);

  // 4. Return resultaat
  return res.json({
    transactionId: txId,
    ...result,
  });
});

export default router;
