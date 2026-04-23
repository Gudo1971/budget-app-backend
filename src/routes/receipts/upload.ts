import crypto from "crypto";
import fs from "fs";
import { Request, Response } from "express";
import { db } from "../../lib/db";
import { MatchDuplicate } from "../../shared/types/matching";
console.log(">>> SMART UPLOAD ROUTE ACTIVE <<<");
const USER_ID = "demo-user";

type RawDuplicateRow = {
  receiptId: number;
  transactionId: number | null;
  id: number | null;
  amount: number | null;
  date: string | null;
  merchant: string | null;
};

export default async function smartUploadReceipt(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const transactionId = req.body.transactionId
      ? Number(req.body.transactionId)
      : null;

    // 1. HASH BEREKENEN
    const fileBuffer = fs.readFileSync(file.path);
    const imageHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // ⭐ BRANCH 1 — BON KOPPELEN AAN BESTAANDE TRANSACTIE
    if (transactionId) {
      console.log(
        ">>> Upload gekoppeld aan bestaande transactie:",
        transactionId,
      );

      // 1. Receipt opslaan
      const insert = db.prepare(
        `
        INSERT INTO receipts 
        (filename, original_name, user_id, status, imageHash, transaction_id)
        VALUES (?, ?, ?, 'processed', ?, ?)
        `,
      );

      const result = insert.run(
        `${USER_ID}/${file.filename}`,
        file.originalname,
        USER_ID,
        imageHash,
        transactionId,
      );

      const receiptId = result.lastInsertRowid as number;

      // 2. Transactie updaten met receipt_id
      db.prepare(
        `
        UPDATE transactions
        SET receipt_id = ?
        WHERE id = ? AND user_id = ?
        `,
      ).run(receiptId, transactionId, USER_ID);

      return res.json({
        action: "linked",
        receiptId,
        transactionId,
        url: `http://localhost:3001/uploads/${USER_ID}/${file.filename}`,
        summary: "Bon gekoppeld aan bestaande transactie",
      });
    }

    // ⭐ BRANCH 2 — NORMALE SMART UPLOAD FLOW
    // 2. DUPLICATE CHECK
    const duplicate = db
      .prepare(
        `
        SELECT 
          r.id AS receiptId,
          r.transaction_id AS transactionId,
          t.id AS id,
          t.amount AS amount,
          t.transaction_date AS date,
          t.merchant AS merchant
        FROM receipts r
        LEFT JOIN transactions t ON r.transaction_id = t.id
        WHERE r.imageHash = ? AND r.user_id = ?
        `,
      )
      .get(imageHash, USER_ID) as RawDuplicateRow | undefined;

    if (duplicate) {
      return res.json({
        action: "duplicate",
        duplicate,
        summary: "Deze bon is al geüpload",
      });
    }

    // 3. NIEUWE RECEIPT OPSLAAN
    const insert = db.prepare(
      `
      INSERT INTO receipts 
      (filename, original_name, user_id, status, imageHash)
      VALUES (?, ?, ?, 'pending', ?)
      `,
    );

    const result = insert.run(
      `${USER_ID}/${file.filename}`,
      file.originalname,
      USER_ID,
      imageHash,
    );

    const receiptId = result.lastInsertRowid as number;

    // 4. TERUGSTUREN
    return res.json({
      action: "uploaded",
      receiptId,
      url: `http://localhost:3001/uploads/${USER_ID}/${file.filename}`,
      summary: "Bon geüpload en klaar voor analyse",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
