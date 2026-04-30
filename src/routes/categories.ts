import { Router } from "express";
import { pool } from "../lib/db";
import { generateColor } from "../utils/generateColor";

const router = Router();

// GET /categories → alle categorieën ophalen
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const result = await pool.query(
      `
      SELECT id, name, color
      FROM categories
      WHERE user_id = $1
      ORDER BY name ASC
      `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /categories → nieuwe categorie toevoegen
router.post("/", async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "Missing userId or name" });
    }

    const color = generateColor(); // ⭐ kleur voor nieuwe categorie

    const result = await pool.query(
      `
      INSERT INTO categories (user_id, name, type, color)
      VALUES ($1, $2, 'variable', $3)
      RETURNING id
      `,
      [userId, name.trim(), color],
    );

    res.json({
      id: result.rows[0].id,
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
