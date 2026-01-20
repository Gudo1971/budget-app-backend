"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../lib/db");
const matching_service_1 = require("../../services/matching/matching.service");
const router = (0, express_1.Router)();
const USER_ID = "demo-user";
router.get("/:id/match", async (req, res) => {
    const receiptId = Number(req.params.id);
    if (!receiptId) {
        return res.status(400).json({ error: "Invalid receipt ID" });
    }
    // 1. RECEIPT OPHALEN
    const receipt = db_1.db
        .prepare(`
      SELECT id, aiResult
      FROM receipts
      WHERE id = ? AND user_id = ?
      `)
        .get(receiptId, USER_ID);
    if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
    }
    // 2. AI RESULT PARSEN
    let extracted = {};
    try {
        extracted = JSON.parse(receipt.aiResult ?? "{}");
    }
    catch {
        extracted = {};
    }
    console.log("🔍 MATCH DEBUG - aiResult from DB:", receipt.aiResult);
    console.log("🔍 MATCH DEBUG - Parsed extracted:", extracted);
    // 3. VALIDATIE — AI RESULT MOET BESTAAN
    if (!extracted.total || !extracted.merchant) {
        console.log("❌ VALIDATION FAILED:", {
            hasTotal: !!extracted.total,
            hasMerchant: !!extracted.merchant,
        });
        return res.status(400).json({
            error: "Receipt has no merchant or total. AI analysis may have failed.",
        });
    }
    // ⭐ ALS GEEN DATE: GEBRUIK VANDAAG
    if (!extracted.date) {
        console.log("⚠️  No date on receipt, using today's date");
        extracted.date = new Date().toISOString().split("T")[0];
    }
    // 4. MATCHING ENGINE V2
    const matchInput = {
        receiptId: receipt.id,
        amount: extracted.total,
        date: extracted.date,
        merchant: extracted.merchant,
    };
    const matchResult = matching_service_1.matchingService.findMatch(matchInput, USER_ID);
    console.log("🔍 MATCH RESULT (v2):", matchResult);
    // 5. TERUGSTUREN — DIRECT HET MATCHRESULT
    return res.json(matchResult);
});
exports.default = router;
