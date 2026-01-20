"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = analyzeReceipt;
const db_1 = require("../../lib/db");
const USER_ID = "demo-user";
async function analyzeReceipt(req, res) {
    try {
        const receiptId = Number(req.params.id);
        if (!receiptId) {
            return res.status(400).json({ error: "Invalid receipt ID" });
        }
        // 1. RECEIPT OPHALEN
        const receipt = db_1.db
            .prepare(`
        SELECT *
        FROM receipts
        WHERE id = ? AND user_id = ?
        `)
            .get(receiptId, USER_ID);
        if (!receipt) {
            return res.status(404).json({ error: "Receipt not found" });
        }
        // 2. OCR (placeholder)
        const ocrText = "OCR not implemented yet";
        // 3. AI ANALYSE (placeholder)
        const aiResult = {
            merchant: "Unknown",
            date: "",
            total: 0,
        };
        // 4. OPSLAAN IN DB
        db_1.db.prepare(`
      UPDATE receipts
      SET ocrText = ?, aiResult = ?, status = 'analyzed'
      WHERE id = ?
      `).run(ocrText, JSON.stringify(aiResult), receiptId);
        // 5. TERUGSTUREN — GEEN MATCHING HIER
        return res.json({
            action: "analyzed",
            receiptId,
            aiResult,
            message: "Receipt analyzed. Run /match to find a transaction.",
        });
    }
    catch (err) {
        console.error("Analyze error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
