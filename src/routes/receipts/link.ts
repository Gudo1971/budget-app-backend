import { Router } from "express";
import { db } from "../../lib/db";

const router = Router();
const USER_ID = "demo-user";

// ------------------------------------------------------------
// POST /receipts/:id/link → bon koppelen aan bestaande transactie
// ------------------------------------------------------------
router.post("/:id/link", (req, res) => {
  const receiptId = req.params.id;
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: "transactionId is required" });
  }

  // Check of bon bestaat
  const receipt = db
    .prepare("SELECT id FROM receipts WHERE id = ? AND user_id = ?")
    .get(receiptId, USER_ID);

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  // Check of transactie bestaat
  const transaction = db
    .prepare("SELECT id FROM transactions WHERE id = ? AND user_id = ?")
    .get(transactionId, USER_ID);

  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  // Koppel bon aan transactie
  db.prepare(
    `
    UPDATE transactions
    SET receipt_id = ?
    WHERE id = ? AND user_id = ?
  `
  ).run(receiptId, transactionId, USER_ID);

  res.json({
    success: true,
    message: "Receipt linked to transaction",
    transactionId,
    receiptId,
  });
});

// ------------------------------------------------------------
// POST /receipts/:id/create-transaction
// → nieuwe transactie aanmaken + bon koppelen
// ------------------------------------------------------------
router.post("/:id/create-transaction", (req, res) => {
  const receiptId = req.params.id;
  const { description, amount, date, merchant, category_id } = req.body;

  if (!amount || !date) {
    return res.status(400).json({
      error: "amount and date are required to create a transaction",
    });
  }

  // Check of bon bestaat
  const receipt = db
    .prepare("SELECT id FROM receipts WHERE id = ? AND user_id = ?")
    .get(receiptId, USER_ID);

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  // Nieuwe transactie aanmaken
  const stmt = db.prepare(
    `
    INSERT INTO transactions (description, amount, date, merchant, category_id, user_id, receipt_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  );

  const result = stmt.run(
    description || merchant || "Onbekende transactie",
    amount,
    date,
    merchant || null,
    category_id || null,
    USER_ID,
    receiptId
  );

  const newTransactionId = result.lastInsertRowid;

  res.json({
    success: true,
    message: "New transaction created and receipt linked",
    transactionId: newTransactionId,
    receiptId,
  });
});

// ------------------------------------------------------------
// POST /transactions/:id/category → gebruiker bevestigt categorie
// ------------------------------------------------------------
router.post("/category/confirm", (req, res) => {
  const { transactionId, category_id, merchant } = req.body;

  if (!transactionId || !category_id) {
    return res.status(400).json({
      error: "transactionId and category_id are required",
    });
  }

  // Update transactie
  db.prepare(
    `
    UPDATE transactions
    SET category_id = ?
    WHERE id = ? AND user_id = ?
  `
  ).run(category_id, transactionId, USER_ID);

  // Merchant-memory bijwerken (optioneel merchant kan null zijn)
  if (merchant) {
    db.prepare(
      `
      INSERT OR REPLACE INTO merchant_memory (merchant, category_id, user_id)
      VALUES (?, ?, ?)
    `
    ).run(merchant, category_id, USER_ID);
  }

  res.json({
    success: true,
    message: "Category confirmed and merchant memory updated",
    transactionId,
    category_id,
  });
});

export default router;
