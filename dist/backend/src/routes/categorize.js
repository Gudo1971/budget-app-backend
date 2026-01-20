"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categorizeTransaction_1 = require("../categorization/categorizeTransaction");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const result = await (0, categorizeTransaction_1.categorizeTransaction)(req.body);
        res.json(result);
    }
    catch (err) {
        console.error("Categorize error:", err);
        res.status(500).json({ error: "Categorization failed" });
    }
});
exports.default = router;
