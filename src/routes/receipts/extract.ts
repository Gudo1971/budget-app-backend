import { Router } from "express";
import fs from "fs";
import path from "path";
import { pool } from "../../lib/db";
import { extractReceiptFromImage } from "../../ai/extractors/extractReceiptFromImage";
import { resolveCategory } from "../../services/categories/resolveCategory";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";

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
    const receiptResult = await pool.query(
      `
      SELECT *
      FROM receipts
      WHERE id = $1 AND user_id = $2
      `,
      [id, USER_ID],
    );

    const receipt = receiptResult.rows[0] as ReceiptRecord | undefined;

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

    // 3. Buffer lezen
    const buffer = fs.readFileSync(filePath);

    // 4. Extractie uitvoeren
    const extracted = await extractReceiptFromImage(buffer);
    const parsedJson = extracted.parsedJson;

    console.log("🔍 EXTRACTED PARSED JSON:", parsedJson);

    // 5. Merchant normaliseren
    const rawMerchant = parsedJson.merchant ?? "";
    const normMerchant = normalizeMerchant(rawMerchant);

    // 6. Beschrijving + bedrag bepalen
    const description = normMerchant.display;
    const amount = parsedJson.total ?? 0;

    // 7. Categorisatie via resolveCategory (SUGGESTIE)
    const category = await resolveCategory(
      USER_ID,
      normMerchant.key,
      description,
      amount,
    );

    // 8. parsedJson verrijken
    parsedJson.merchant = normMerchant.display;
    parsedJson.merchant_category = category.category_id;
    parsedJson.category = null;
    parsedJson.subcategory = null;

    // 9. Opslaan in DB
    await pool.query(
      `
      UPDATE receipts
      SET
        merchant = $1,
        purchase_date = $2,
        total = $3,
        ocrText = $4,
        aiResult = $5,
        status = 'processed'
      WHERE id = $6
      `,
      [
        normMerchant.key,
        parsedJson.date ?? null,
        parsedJson.total ?? null,
        extracted.ocrText ?? null,
        JSON.stringify(parsedJson),
        receipt.id,
      ],
    );

    // 10. Normalized block voor matching v2
    const normalized = {
      amount: parsedJson.total ?? null,
      date: parsedJson.date ?? null,
      merchant: normMerchant.key,
    };

    res.json({
      action: "extracted",
      receiptId: id,
      extracted: { ...extracted, parsedJson },
      normalized,
      summary: "Receipt successfully analyzed",
    });
  } catch (err) {
    console.error("Extract route error:", err);
    res.status(500).json({ error: "Extraction failed", details: String(err) });
  }
});

export default router;
