"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../lib/db");
const categorizeTransaction_1 = require("../../categorization/categorizeTransaction");
const router = (0, express_1.Router)();
router.post("/:id", async (req, res) => {
    const txId = Number(req.params.id);
    const USER_ID = req.body.userId || "demo-user";
    // 1. Haal transactie op
    const tx = db_1.db
        .prepare(`SELECT id, amount, date, merchant, description
       FROM transactions
       WHERE id = ? AND user_id = ?`)
        .get(txId, USER_ID);
    if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
    }
    // 2. Bouw categorisatie-input
    const input = {
        userId: USER_ID,
        merchantName: tx.merchant,
        description: tx.description ?? tx.merchant,
        amount: tx.amount,
        date: tx.date,
    };
    // 3. Categoriseer
    const result = await (0, categorizeTransaction_1.categorizeTransaction)(input);
    // 4. Return resultaat
    return res.json({
        transactionId: txId,
        ...result,
    });
});
exports.default = router;
