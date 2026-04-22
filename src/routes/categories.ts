import { Router } from "express";
import { db } from "../lib/db";
import { generateColor } from "../utils/generateColor";

const router = Router();

// GET /categories → alle categorieën ophalen
router.get("/", (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const categories = db
      .prepare(
        `
        SELECT id, name, color
        FROM categories
        WHERE user_id = ?
        ORDER BY name ASC
      `,
      )
      .all(userId);

    res.json(categories);
  } catch (error) {
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

    const color = generateColor(); // ⭐ kleur voor nieuwe categorie

    const stmt = db.prepare(`
      INSERT INTO categories (user_id, name, type, color)
      VALUES (?, ?, 'variable', ?)
    `);

    const result = stmt.run(userId, name.trim(), color);

    res.json({
      id: result.lastInsertRowid,
      name: name.trim(),
      type: "custom",
      color,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

export default router;
