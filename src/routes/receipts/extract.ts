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

    // 1. Receipt ophalen
    const receipt = db
      .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
      .get(id, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // 2. Bestand ophalen
    const filePath = path.join(
      process.cwd(),
      "uploads",
      USER_ID,
      receipt.filename,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // 3. Buffer lezen (correct)
    const buffer = fs.readFileSync(filePath);

    // 4. Extractie uitvoeren (Buffer!)
    const extracted = await extractReceiptFromImage(buffer);

    const parsedJson = extracted.parsedJson;

    // 5. Merchant categorisatie
    const merchantCategory = await determineMerchantCategory(parsedJson, db);
    parsedJson.merchant_category = merchantCategory;

    // 6. Opslaan in DB
    db.prepare(
      `
  UPDATE receipts
  SET
    merchant = ?,
    merchant_category = ?,
    purchase_date = ?,
    total = ?,
    ocrText = ?,
    aiResult = ?,
    status = 'processed'
  WHERE id = ?
`,
    ).run(
      parsedJson.merchant ?? null,
      parsedJson.merchant_category ?? null,
      parsedJson.date ?? null, // ← werkt zolang jouw Vision JSON een "date" veld heeft
      parsedJson.total ?? null,
      extracted.ocrText ?? null,
      JSON.stringify(parsedJson),
      receipt.id,
    );

    // 7. Response
    res.json({
      action: "extracted",
      receiptId: id,
      extracted: { ...extracted, parsedJson },
      summary: "Receipt successfully analyzed",
    });
  } catch (err) {
    console.error("Extract route error:", err);
    res.status(500).json({ error: "Extraction failed", details: String(err) });
  }
});

export default router;
