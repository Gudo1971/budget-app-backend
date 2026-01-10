import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import archiver from "archiver";
import { extractReceiptFromImage } from "../ai/extractors/extractReceiptFromImage";

const router = Router();

// Hardcoded user
const USER_ID = "demo-user";

// Upload directory
const userUploadDir = path.join(process.cwd(), "uploads", USER_ID);
fs.mkdirSync(userUploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, userUploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

// Dit is jouw echte DB-record type
type ReceiptRecord = {
  id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
  user_id: string;
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
        "SELECT id, filename, original_name, uploaded_at, ocrText, aiResult FROM receipts WHERE user_id = ? ORDER BY uploaded_at DESC"
      )
      .all(USER_ID) as ReceiptRecord[];

    res.json(receipts);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Failed to fetch receipts" });
  }
});

// ------------------------------------------------------------
// GET /receipts/:id → één bon
// ------------------------------------------------------------
router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const receipt = db
      .prepare(
        "SELECT id, filename, original_name, uploaded_at, ocrText, aiResult FROM receipts WHERE id = ? AND user_id = ?"
      )
      .get(id, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    res.json(receipt);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

// ------------------------------------------------------------
// GET /receipts/:id/file → DOWNLOAD echte file
// ------------------------------------------------------------
router.get("/:id/file", (req: Request, res: Response) => {
  const { id } = req.params;

  const receipt = db
    .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
    .get(id, USER_ID) as ReceiptRecord | undefined;

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const filePath = path.join(userUploadDir, receipt.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${receipt.original_name}"`
  );
  res.setHeader("Content-Type", "application/octet-stream");

  return res.sendFile(filePath);
});

// ------------------------------------------------------------
// POST /receipts/upload → upload meerdere bonnen
// ------------------------------------------------------------
router.post(
  "/upload",
  upload.array("files", 20),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    try {
      const stmt = db.prepare(
        "INSERT INTO receipts (filename, original_name, user_id) VALUES (?, ?, ?)"
      );

      for (const file of files) {
        stmt.run(file.filename, file.originalname, USER_ID);
      }

      const receipts = db
        .prepare(
          "SELECT id, filename, original_name, uploaded_at, ocrText, aiResult FROM receipts WHERE user_id = ? ORDER BY uploaded_at DESC"
        )
        .all(USER_ID) as ReceiptRecord[];

      res.json({
        message: "Receipts uploaded",
        receipts,
      });
    } catch (err) {
      console.error("DB error:", err);
      res.status(500).json({ error: "Database insert failed" });
    }
  }
);

// ------------------------------------------------------------
// DELETE /receipts/:id → bon verwijderen
// ------------------------------------------------------------
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const receipt = db
      .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
      .get(id, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const filePath = path.join(userUploadDir, receipt.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare("DELETE FROM receipts WHERE id = ? AND user_id = ?").run(
      id,
      USER_ID
    );

    res.json({ message: "Receipt deleted" });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Failed to delete receipt" });
  }
});

// ------------------------------------------------------------
// GET /receipts/zip → ZIP download
// ------------------------------------------------------------
router.get("/zip", async (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) {
    return res.status(400).json({ error: "No IDs provided" });
  }

  const ids = idsParam.toString().split(",");
  const placeholders = ids.map(() => "?").join(",");

  const receipts = db
    .prepare(
      `SELECT * FROM receipts WHERE id IN (${placeholders}) AND user_id = ?`
    )
    .all(...ids, USER_ID) as ReceiptRecord[];

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=receipts.zip");

  const archive = archiver("zip");
  archive.pipe(res);

  for (const receipt of receipts) {
    const filePath = path.join(userUploadDir, receipt.filename);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: receipt.original_name });
    }
  }

  archive.finalize();
});

// ------------------------------------------------------------
// POST /receipts/:id/extract → AI extractie
// ------------------------------------------------------------
router.post("/:id/extract", async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = db
      .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
      .get(id, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const filePath = path.join(userUploadDir, receipt.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // ⭐ Gebruik je ngrok URL hier
    const fileUrl = `https://investible-cycadlike-kaidence.ngrok-free.dev/api/receipts/${id}/file`;

    const extracted = await extractReceiptFromImage(fileUrl);

    db.prepare(
      `
      UPDATE receipts
      SET ocrText = ?, aiResult = ?
      WHERE id = ? AND user_id = ?
    `
    ).run(extracted.ocrText, JSON.stringify(extracted.parsedJson), id, USER_ID);

    res.json({
      success: true,
      receiptId: id,
      extracted,
    });
  } catch (err) {
    console.error("Receipt extraction error:", err);
    res.status(500).json({ error: "Receipt extraction failed" });
  }
});

export default router;
