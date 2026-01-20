import { Router } from "express";
import { db } from "../../lib/db";
import { ParsedAIResult } from "../../../../shared/types/ParsedAIResult";
import { ReceiptRecord } from "../../../../shared/types/ReceiptRecord";
import { transactionService } from "../../services/transactions/transactions.service";

const router = Router();

router.post("/:id/link", async (req, res) => {
  try {
    const receiptId = Number(req.params.id);
    const USER_ID = req.body.userId || "demo-user";

    // 1. Haal receipt op
    const receipt = db
      .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
      .get(receiptId, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    if (!receipt.aiResult) {
      return res.status(400).json({ error: "Receipt has no AI result yet" });
    }

    const parsed = JSON.parse(receipt.aiResult) as ParsedAIResult;

    // 2. Gebruik de centrale create-flow
    const result = await transactionService.create({
      receiptId,
      extracted: parsed,
      form: {
        date: req.body.date ?? null,
        category: req.body.category ?? null,
        subcategory: req.body.subcategory ?? null,
      },
      source: "extracted",
      userId: USER_ID,
    });

    res.json(result);
  } catch (err) {
    console.error("Link route error:", err);
    res.status(500).json({ error: "Linking failed", details: String(err) });
  }
});

export default router;
