"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../lib/db");
const router = (0, express_1.Router)();
router.put("/:id/archive", (req, res) => {
    const id = req.params.id;
    db_1.db.prepare("UPDATE receipts SET status = 'archived' WHERE id = ?").run(id);
    res.json({ success: true });
});
exports.default = router;
