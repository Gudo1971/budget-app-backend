import { Router } from "express";
import { db } from "../../lib/db";
import { Transaction } from "../../../../shared/types/Transaction";

const router = Router();
const USER_ID = "demo-user";

router.post("/:id/confirm-link", (req, res) => {
  const receiptId = Number(req.params.id);
  const { transactionId } = req.body;

  console.log("🔗 [CONFIRM LINK] Request received:", {
    receiptId,
    transactionId,
  });

  if (!receiptId || !transactionId) {
    return res.status(400).json({
      error: "receiptId and transactionId are required",
    });
  }

  // 1. Check receipt exists
  const receipt = db
    .prepare(
      `
      SELECT id
      FROM receipts
      WHERE id = ? AND user_id = ?
    `,
    )
    .get(receiptId, USER_ID);

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  // 2. Check transaction exists
  const transaction = db
    .prepare(
      `
      SELECT id, receipt_id
      FROM transactions
      WHERE id = ? AND user_id = ?
    `,
    )
    .get(transactionId, USER_ID) as
    | Pick<Transaction, "id" | "receipt_id">
    | undefined;

  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  // 3. Prevent double linking
  if (transaction.receipt_id) {
    return res.status(400).json({
      error: "Transaction already has a linked receipt",
    });
  }

  // ⭐ 4. Link transaction → receipt
  db.prepare(
    `
      UPDATE transactions
      SET receipt_id = ?
      WHERE id = ? AND user_id = ?
    `,
  ).run(receiptId, transactionId, USER_ID);

  // ⭐ 5. Link receipt → transaction (belangrijk!)
  db.prepare(
    `
      UPDATE receipts
      SET transaction_id = ?
      WHERE id = ? AND user_id = ?
    `,
  ).run(transactionId, receiptId, USER_ID);

  return res.json({
    action: "linked",
    receiptId,
    transactionId,
    summary: "Receipt successfully linked to transaction",
  });
});

export default router;
