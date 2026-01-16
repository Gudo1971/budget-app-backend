import { Router } from "express";
import { db } from "../../lib/db";
import { findMatchingTransaction } from "../../ai/matching/findMatchingTransaction";

const router = Router();
const USER_ID = "demo-user";

type ReceiptRow = {
  id: number;
  aiResult: string | null;
  status: string;
  transaction_id: number | null;
};

// ------------------------------------------------------------
// POST /receipts/:id/create-or-link
// ------------------------------------------------------------
router.post("/:id/create-or-link", async (req, res) => {
  const receiptId = Number(req.params.id);
  const { userChoice, extracted } = req.body;

  // 1. Haal bon op
  const receipt = db
    .prepare(
      `SELECT id, aiResult, status, transaction_id
     FROM receipts
     WHERE id = ? AND user_id = ?`
    )
    .get(receiptId, USER_ID) as ReceiptRow | undefined;

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  if (!receipt.aiResult) {
    return res.status(400).json({ error: "Receipt has no AI data" });
  }

  const parsed = JSON.parse(receipt.aiResult);

  // 2. Zoek naar bestaande transactie
  const { match, confidence } = await findMatchingTransaction({
    amount: parsed.total,
    date: parsed.date,
    merchant: parsed.merchant,
  });

  // ------------------------------------------------------------
  // CASE A — MATCH GEVONDEN, MAAR GEBRUIKER HEEFT NOG NIET GEKOZEN
  // ------------------------------------------------------------
  if (match && !userChoice) {
    return res.json({
      action: "ask-user",
      match,
      confidence,
      message:
        "Er bestaat al een transactie die lijkt te horen bij deze bon. Wil je koppelen?",
    });
  }

  // ------------------------------------------------------------
  // CASE B — MATCH GEVONDEN, GEBRUIKER ZEGT JA
  // ------------------------------------------------------------
  if (match && userChoice === "yes") {
    const txId = Number(match.id);

    db.prepare(
      `UPDATE receipts
       SET transaction_id = ?, status = 'archived'
       WHERE id = ? AND user_id = ?`
    ).run(txId, receiptId, USER_ID);

    db.prepare(
      `UPDATE transactions
       SET receipt_id = ?
       WHERE id = ? AND user_id = ?`
    ).run(receiptId, txId, USER_ID);

    return res.json({
      action: "linked-existing",
      success: true,
      transaction: { ...match, id: txId },
    });
  }

  // ------------------------------------------------------------
  // CASE C — MATCH GEVONDEN, GEBRUIKER ZEGT NEE
  // ------------------------------------------------------------
  if (match && userChoice === "no") {
    db.prepare(
      `UPDATE receipts
       SET status = 'in_afwachting'
       WHERE id = ? AND user_id = ?`
    ).run(receiptId, USER_ID);

    return res.json({
      action: "moved-to-awaiting",
      success: true,
      message: "Bon is verplaatst naar archief met status 'in afwachting'.",
    });
  }

  // ------------------------------------------------------------
  // CASE D — GEEN MATCH → NIEUWE TRANSACTIE MAKEN
  // ------------------------------------------------------------
  if (!extracted) {
    return res.status(400).json({
      error: "Missing extracted data for duplicate check",
    });
  }

  const d = extracted.date.split("T")[0];
  const amount = -Math.abs(extracted.total);
  const merchant = extracted.merchant;

  // DUPLICATE CHECK
  const duplicate = db
    .prepare(
      `SELECT id FROM transactions
     WHERE user_id = ?
       AND amount = ?
       AND merchant = ?
       AND date = ?`
    )
    .get(USER_ID, amount, merchant, d) as { id: number } | undefined;

  if (duplicate) {
    return res.status(409).json({
      action: "duplicate",
      success: false,
      transactionId: duplicate.id,
    });
  }

  // NIEUWE TRANSACTIE
  const insert = db.prepare(
    `INSERT INTO transactions (
      amount, date, transaction_date,
      merchant, description, user_id, receipt_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const result = insert.run(
    amount,
    d,
    d,
    merchant,
    merchant,
    USER_ID,
    receiptId
  );

  const newId = Number(result.lastInsertRowid);

  // BON KOPPELEN + ARCHIVEREN
  db.prepare(
    `UPDATE receipts
     SET transaction_id = ?, status = 'archived'
     WHERE id = ? AND user_id = ?`
  ).run(newId, receiptId, USER_ID);

  return res.json({
    action: "created-new",
    success: true,
    transactionId: newId,
  });
});

// ------------------------------------------------------------
// POST /receipts/:id/link-existing
// ------------------------------------------------------------
router.post("/:id/link-existing", (req, res) => {
  const receiptId = Number(req.params.id);
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: "Missing transactionId" });
  }

  try {
    db.prepare(
      `UPDATE receipts
       SET transaction_id = ?, status = 'archived'
       WHERE id = ? AND user_id = ?`
    ).run(transactionId, receiptId, USER_ID);

    db.prepare(
      `UPDATE transactions
       SET receipt_id = ?
       WHERE id = ? AND user_id = ?`
    ).run(receiptId, transactionId, USER_ID);

    return res.json({
      action: "linked-existing",
      success: true,
      transactionId,
    });
  } catch (err) {
    console.error("Error linking existing transaction:", err);
    return res
      .status(500)
      .json({ error: "Failed to link existing transaction" });
  }
});

export default router;
