import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /budget-categories → alle categorie-budgetten ophalen
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT 
        bc.id,
        bc.month,
        bc.category_id,
        c.name AS category_name,
        c.type AS category_type,
        bc.budget_amount
      FROM budget_categories bc
      JOIN categories c ON c.id = bc.category_id
      ORDER BY bc.month DESC, c.name ASC
    `
      )
      .all();

    res.json(rows);
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    res.status(500).json({ error: "Failed to fetch budget categories" });
  }
});

// POST /budget-categories → budget voor categorie instellen
router.post("/", (req, res) => {
  try {
    const { month, category_id, budget_amount } = req.body;

    if (!month || !category_id || !budget_amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO budget_categories (month, category_id, budget_amount)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(month, category_id, budget_amount);

    res.json({
      id: result.lastInsertRowid,
      month,
      category_id,
      budget_amount,
    });
  } catch (error) {
    console.error("Error creating budget category:", error);
    res.status(500).json({ error: "Failed to create budget category" });
  }
});

export default router;
