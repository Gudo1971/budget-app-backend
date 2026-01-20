"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
// GET /categories → alle categorieën ophalen
router.get("/", (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }
        const categories = db_1.db
            .prepare(`
        SELECT id, name
        FROM categories
        WHERE user_id = ?
        ORDER BY name ASC
      `)
            .all(userId);
        res.json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
// POST /categories → nieuwe categorie toevoegen
router.post("/", (req, res) => {
    try {
        const { userId, name } = req.body;
        if (!userId || !name) {
            return res.status(400).json({ error: "Missing userId or name" });
        }
        const stmt = db_1.db.prepare(`
      INSERT INTO categories (user_id, name, type)
      VALUES (?, ?, 'custom')
    `);
        const result = stmt.run(userId, name.trim());
        res.json({
            id: result.lastInsertRowid,
            name: name.trim(),
            type: "custom",
        });
    }
    catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
});
exports.default = router;
