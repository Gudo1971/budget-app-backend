"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../../lib/db");
const extractReceiptFromImage_1 = require("../../ai/extractors/extractReceiptFromImage");
const categorization_1 = require("../../utils/categorization");
const router = (0, express_1.Router)();
const USER_ID = "demo-user";
router.post("/:id/extract", async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Receipt ophalen
        const receipt = db_1.db
            .prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?")
            .get(id, USER_ID);
        if (!receipt) {
            return res.status(404).json({ error: "Receipt not found" });
        }
        // 2. Bestand ophalen
        const filePath = path_1.default.join(process.cwd(), "uploads", USER_ID, receipt.filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }
        // 3. Buffer lezen
        const buffer = fs_1.default.readFileSync(filePath);
        // 4. Extractie uitvoeren
        const extracted = await (0, extractReceiptFromImage_1.extractReceiptFromImage)(buffer);
        const parsedJson = extracted.parsedJson;
        console.log("🔍 EXTRACTED PARSED JSON:", JSON.stringify(parsedJson, null, 2));
        // 5. Merchant categorisatie
        const merchantCategory = await (0, categorization_1.determineMerchantCategory)(parsedJson, db_1.db);
        parsedJson.merchant_category = merchantCategory;
        parsedJson.category = merchantCategory;
        parsedJson.subcategory = null;
        // 6. Opslaan in DB
        console.log("💾 SAVING TO DB:", {
            merchant: parsedJson.merchant,
            date: parsedJson.date,
            total: parsedJson.total,
            aiResult: parsedJson,
        });
        db_1.db.prepare(`
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
    `).run(parsedJson.merchant ?? null, parsedJson.merchant_category ?? null, parsedJson.date ?? null, parsedJson.total ?? null, extracted.ocrText ?? null, JSON.stringify(parsedJson), receipt.id);
        // ⭐ 7. Normalized block voor v2 matching engine
        const normalized = {
            amount: parsedJson.total ?? null,
            date: parsedJson.date ?? null,
            merchant: parsedJson.merchant ?? null,
        };
        // 8. Response
        res.json({
            action: "extracted",
            receiptId: id,
            extracted: { ...extracted, parsedJson },
            normalized,
            summary: "Receipt successfully analyzed",
        });
    }
    catch (err) {
        console.error("Extract route error:", err);
        res.status(500).json({ error: "Extraction failed", details: String(err) });
    }
});
exports.default = router;
