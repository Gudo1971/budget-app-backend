import { Router } from "express";
import { db } from "../../lib/db";
import { normalizeMerchant } from "../../utils/merchant";
import { updateMerchantMemory } from "../../utils/merchantMemory";
import { ParsedAIResult } from "../../types/ParsedAIResult";
import { ReceiptRecord } from "../../types/ReceiptRecord";

const router = Router();
const USER_ID = "demo-user";
console.log("LINK ROUTE HIT");

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

    // 2. Normaliseer amount
    const rawAmount = parsed.total;
    const cleanedAmount = String(rawAmount)
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".");
    const normalizedAmount = Number(cleanedAmount);

    if (!normalizedAmount || isNaN(normalizedAmount)) {
      throw new Error(`Invalid amount extracted: ${rawAmount}`);
    }

    // 3. Normaliseer date
    // 3. Normaliseer date (UI > AI > error)
    const rawDate = req.body.date || parsed.date || parsed.purchase_date;

    if (!rawDate) {
      throw new Error("No date provided");
    }

    const normalizedDate = new Date(rawDate).toISOString().slice(0, 10);

    // 4. Normaliseer merchant
    const rawMerchant = parsed.merchant;
    if (!rawMerchant || rawMerchant.trim() === "") {
      throw new Error("No merchant extracted from receipt");
    }

    const normalizedMerchant = normalizeMerchant(rawMerchant);

    // 5. Bepaal categorieën
    const finalCategory =
      req.body.category ||
      parsed.category ||
      parsed.merchant_category ||
      "Uncategorized";

    const finalSubcategory =
      req.body.subcategory || parsed.subcategory || parsed.subCategory || null;

    const finalMerchantCategory = parsed.merchant_category || null;

    // 6. Insert transaction (INCLUSIEF categorie)
    const insert = db.prepare(`
      INSERT INTO transactions (
        amount,
        date,
        transaction_date,
        merchant,
        description,
        category,
        subcategory,
        user_id,
        receipt_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      normalizedAmount,
      normalizedDate,
      normalizedDate,
      normalizedMerchant,
      normalizedMerchant,
      finalCategory,
      finalSubcategory,
      USER_ID,
      receiptId,
    );

    const newTransactionId = result.lastInsertRowid;

    // 7. Update merchant memory
    updateMerchantMemory({
      db,
      userId: USER_ID,
      merchant: normalizedMerchant,
      category: finalCategory,
      subcategory: finalSubcategory,
    });

    // 8. Update receipt (INCLUSIEF categorie)
    const update = db.prepare(`
      UPDATE receipts
      SET 
        transaction_id = ?, 
        status = 'archived',
        category = ?,
        subCategory = ?,
        merchant_category = ?
      WHERE id = ? AND user_id = ?
    `);

    const updateResult = update.run(
      newTransactionId,
      finalCategory,
      finalSubcategory,
      finalMerchantCategory,
      receiptId,
      USER_ID,
    );

    if (updateResult.changes === 0) {
      throw new Error("Receipt update failed");
    }

    // 9. Response
    res.json({
      action: "linked",
      receiptId,
      transactionId: newTransactionId,
      category: finalCategory,
      subcategory: finalSubcategory,
      summary: "Receipt successfully linked to transaction",
    });
  } catch (err) {
    console.error("Link route error:", err);
    res.status(500).json({ error: "Linking failed", details: String(err) });
  }
});

export default router;
