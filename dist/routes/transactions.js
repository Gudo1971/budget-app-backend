"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactions_service_1 = require("../services/transactions/transactions.service");
const router = (0, express_1.Router)();
console.log("🚀 transactions router loaded");
router.get("/debug", (req, res) => {
    res.json({ ok: true, route: "transactions router werkt" });
});
// ⭐ GET all transactions
router.get("/", (req, res) => {
    const transactions = transactions_service_1.transactionService.getAll();
    res.json(transactions);
});
// ⭐ POST: Create transaction (supports both old & new format)
router.post("/", (req, res) => {
    console.log("RAW BODY:", req.body);
    // ⭐ Doorgeven wat de frontend stuurt - service bepaalt format
    const result = transactions_service_1.transactionService.create(req.body);
    res.json(result);
});
// ⭐ POST: from extracted receipt
router.post("/from-extracted", (req, res) => {
    const result = transactions_service_1.transactionService.create({
        receiptId: req.body.receiptId,
        extracted: req.body.extracted,
        form: req.body.form,
        source: "extracted-receipt",
    });
    res.json(result);
});
exports.default = router;
