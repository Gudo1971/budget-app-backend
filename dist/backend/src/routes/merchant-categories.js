"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
router.post("/", (req, res) => {
    const { merchant, category } = req.body;
    if (!merchant || !category) {
        return res.status(400).json({ error: "Missing merchant or category" });
    }
    try {
        const stmt = db_1.db.prepare(`
      INSERT INTO merchant_memory (name, category)
      VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET category = excluded.category
    `);
        stmt.run(merchant, category);
        return res.json({ success: true });
    }
    catch (err) {
        console.error("DB error:", err);
        return res.status(500).json({ success: false });
    }
});
exports.default = router;
