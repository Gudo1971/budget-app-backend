import { Router } from "express";
import fs from "fs";
import path from "path";
import { db } from "../../lib/db";
import { extractReceiptFromImage } from "../../ai/extractors/extractReceiptFromImage";
import { determineMerchantCategory } from "../../utils/categorization";

const router = Router();
const USER_ID = "demo-user";

type ReceiptRecord = {
  id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
  user_id: string;
  ocrText?: string | null;
  aiResult?: string | null;
};

router.post("/:id/extract", async (req, res) => {
  try {
    const { id } = req.params;

    const receipt = db
      .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
      .get(id, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      USER_ID,
      receipt.filename
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // ⭐ FIX: lees het bestand als buffer (NIET via URL)

    // ⭐ FIX: stuur buffer naar OpenAI
    const extracted = await extractReceiptFromImage(filePath);

    const parsedJson = extracted.parsedJson;

    const merchantCategory = await determineMerchantCategory(parsedJson, db);
    parsedJson.merchant_category = merchantCategory;

    db.prepare(
      `UPDATE receipts SET ocrText = ?, aiResult = ? WHERE id = ? AND user_id = ?`
    ).run(extracted.ocrText, JSON.stringify(parsedJson), id, USER_ID);

    res.json({
      success: true,
      receiptId: id,
      extracted: { ...extracted, parsedJson },
    });
  } catch (err) {
    console.error("Extract route error:", err);
    res.status(500).json({ error: "Extraction failed", details: String(err) });
  }
});

export default router;
