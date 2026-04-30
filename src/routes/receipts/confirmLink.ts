import { Router } from "express";
import { pool } from "../../lib/db";
import { Transaction } from "../../shared/types/Transaction";

const router = Router();
const USER_ID = "demo-user";

router.post("/:id/confirm-link", async (req, res) => {
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

  try {
    // 1. Check receipt exists
    const receiptResult = await pool.query(
      `
      SELECT id
      FROM receipts
      WHERE id = $1 AND user_id = $2
      `,
      [receiptId, USER_ID],
    );

    if (receiptResult.rows.length === 0) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // 2. Check transaction exists
    const transactionResult = await pool.query(
      `
      SELECT id, receipt_id
      FROM transactions
      WHERE id = $1 AND user_id = $2
      `,
      [transactionId, USER_ID],
    );

    const transaction = transactionResult.rows[0] as
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
    await pool.query(
      `
      UPDATE transactions
      SET receipt_id = $1
      WHERE id = $2 AND user_id = $3
      `,
      [receiptId, transactionId, USER_ID],
    );

    // ⭐ 5. Link receipt → transaction
    await pool.query(
      `
      UPDATE receipts
      SET transaction_id = $1
      WHERE id = $2 AND user_id = $3
      `,
      [transactionId, receiptId, USER_ID],
    );

    return res.json({
      action: "linked",
      receiptId,
      transactionId,
      summary: "Receipt successfully linked to transaction",
    });
  } catch (err) {
    console.error("❌ confirm-link error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
