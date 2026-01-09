import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /categories → alle categorieën ophalen
router.get("/", (req, res) => {
  try {
    const categories = db
      .prepare(
        `
      SELECT id, name, type
      FROM categories
      ORDER BY name ASC
    `
      )
      .all();

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /categories → nieuwe categorie toevoegen
router.post("/", (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, type)
      VALUES (?, ?)
    `);

    const result = stmt.run(name, type);

    res.json({
      id: result.lastInsertRowid,
      name,
      type,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

export default router;
