import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { db } from "../../lib/db";
import { findMatchingTransaction } from "../../ai/matching/findMatchingTransaction";
import smartUploadReceipt from "./upload";
import confirmLinkRoute from "./confirmLink";

const router = Router();
const USER_ID = "demo-user";

const userUploadDir = path.join(process.cwd(), "uploads", USER_ID);
fs.mkdirSync(userUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, userUploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

type ReceiptRecord = {
  id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
  user_id: string;
  status: string;
  transaction_id?: number | null;
  ocrText?: string | null;
  aiResult?: string | null;
};

// ------------------------------------------------------------
// GET /receipts → alle bonnen
// ------------------------------------------------------------
router.get("/", (req: Request, res: Response) => {
  try {
    const receipts = db
      .prepare(
        `
        SELECT 
          id, 
          filename, 
          original_name, 
          uploaded_at, 
          status,
          transaction_id,
          ocrText, 
          aiResult 
        FROM receipts 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
        `,
      )
      .all(USER_ID) as ReceiptRecord[];

    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch receipts" });
  }
});

// ------------------------------------------------------------
// GET /receipts/:id → één bon
// ------------------------------------------------------------
router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const receipt = db
    .prepare(
      `
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `,
    )
    .get(id, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) return res.status(404).json({ error: "Receipt not found" });

  res.json(receipt);
});

// ------------------------------------------------------------
// GET /receipts/:id/file → download
// ------------------------------------------------------------
router.get("/:id/file", (req: Request, res: Response) => {
  const { id } = req.params;

  const receipt = db
    .prepare(
      `
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `,
    )
    .get(id, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) return res.status(404).json({ error: "Receipt not found" });

  const filePath = path.join(userUploadDir, receipt.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${receipt.original_name}"`,
  );
  res.setHeader("Content-Type", "application/octet-stream");

  res.sendFile(filePath);
});

// ------------------------------------------------------------
// POST /receipts/upload → BULK UPLOAD
// ------------------------------------------------------------
router.post(
  "/upload-bulk",
  upload.array("files", 20),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0)
      return res.status(400).json({ error: "No files uploaded" });

    const stmt = db.prepare(
      `
      INSERT INTO receipts 
      (filename, original_name, user_id, status) 
      VALUES (?, ?, ?, 'pending')
      `,
    );

    for (const file of files) {
      stmt.run(file.filename, file.originalname, USER_ID);
    }

    const receipts = db
      .prepare(
        `
        SELECT 
          id, 
          filename, 
          original_name, 
          uploaded_at, 
          status,
          transaction_id,
          ocrText, 
          aiResult 
        FROM receipts 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
        `,
      )
      .all(USER_ID) as ReceiptRecord[];

    res.json({ message: "Receipts uploaded", receipts });
  },
);

// ------------------------------------------------------------
// POST /receipts/upload/smart → SLIMME UPLOAD
// ------------------------------------------------------------
router.post("/upload/smart", upload.single("file"), smartUploadReceipt);

// ------------------------------------------------------------
// DELETE /receipts/:id
// ------------------------------------------------------------
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const receipt = db
    .prepare(
      `
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `,
    )
    .get(id, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) return res.status(404).json({ error: "Receipt not found" });

  const filePath = path.join(userUploadDir, receipt.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare("DELETE FROM receipts WHERE id = ? AND user_id = ?").run(
    id,
    USER_ID,
  );

  res.json({ message: "Receipt deleted" });
});

// ------------------------------------------------------------
// PUT /receipts/:id/confirm-link → koppel aan transactie
// ------------------------------------------------------------
router.use("/", confirmLinkRoute);

// ------------------------------------------------------------
// GET /receipts/:id/match → AI matchen met transacties
// ------------------------------------------------------------
router.get("/:id/match", async (req: Request, res: Response) => {
  const { id } = req.params;

  const receipt = db
    .prepare(
      `
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `,
    )
    .get(id, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  let extracted;
  try {
    extracted = JSON.parse(receipt.aiResult ?? "{}");
  } catch {
    extracted = {};
  }

  const matchResult = await findMatchingTransaction({
    receiptId: receipt.id,
    amount: extracted.total ?? 0,
    date: extracted.date ?? "",
    merchant: extracted.merchant ?? "",
  });

  res.json(matchResult);
});

export default router;
