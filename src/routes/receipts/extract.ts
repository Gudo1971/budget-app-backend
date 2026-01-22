import { Router } from "express";
import fs from "fs";
import path from "path";
import { db } from "../../lib/db";
import { extractReceiptFromImage } from "../../ai/extractors/extractReceiptFromImage";

import { normalizeMerchant } from "@shared/services/normalizeMerchant";
import { categorizeMerchant } from "../../services/merchantMemory/service/categorizeMerchant.service";

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

    // 3. Buffer lezen
    const buffer = fs.readFileSync(filePath);

    // 4. Extractie uitvoeren
    const extracted = await extractReceiptFromImage(buffer);
    const parsedJson = extracted.parsedJson;

    console.log("🔍 EXTRACTED PARSED JSON:", parsedJson);

    // 5. Merchant normaliseren
    const rawMerchant = parsedJson.merchant ?? "";
    const normMerchant = normalizeMerchant(rawMerchant);

    // 6. Categorisatie via nieuwe engine
    const categorization = await categorizeMerchant(
      USER_ID,
      normMerchant.key,
      normMerchant.display,
    );

    // 7. Update parsedJson voor opslag + frontend
    parsedJson.merchant = normMerchant.display;
    parsedJson.category = categorization.category_id;

    parsedJson.subcategory = null; // tenzij je subcategories hebt

    // 8. Opslaan in DB
    db.prepare(
      `
    UPDATE receipts
    SET
      merchant = ?,
      purchase_date = ?,
      total = ?,
      ocrText = ?,
      aiResult = ?,
      status = 'processed'
    WHERE id = ?
  `,
    ).run(
      normMerchant.key,
      parsedJson.date ?? null,
      parsedJson.total ?? null,
      extracted.ocrText ?? null,
      JSON.stringify(parsedJson),
      receipt.id,
    );

    // 9. Normalized block voor matching v2
    const normalized = {
      amount: parsedJson.total ?? null,
      date: parsedJson.date ?? null,
      merchant: normMerchant.key, // FIXED
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
