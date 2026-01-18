import crypto from "crypto";
import fs from "fs";
import { Request, Response } from "express";
import { db } from "../../lib/db";
import { MatchDuplicate } from "../../types/matching";
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

    // 1. HASH BEREKENEN
    const fileBuffer = fs.readFileSync(file.path);
    const imageHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // 2. DUPLICATE CHECK
    const duplicate = db
      .prepare(
        `
        SELECT 
          r.id AS receiptId,
          r.transaction_id AS transactionId,
          t.id AS id,
          t.amount AS amount,
          t.date AS date,
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
    console.log("INSERT PARAMS:", {
      filename: file.filename,
      originalname: file.originalname,
      user: USER_ID,
      hash: imageHash,
    });

    const insert = db.prepare(
      `
      INSERT INTO receipts 
      (filename, original_name, user_id, status, imageHash)
      VALUES (?, ?, ?, 'pending', ?)
      `,
    );

    const result = insert.run(
      file.filename,
      file.originalname,
      USER_ID,
      imageHash,
    );

    const receiptId = result.lastInsertRowid as number;

    // 4. TERUGSTUREN
    return res.json({
      action: "uploaded",
      receiptId,
      summary: "Bon geüpload en klaar voor analyse",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
