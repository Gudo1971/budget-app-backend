import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /budgets → alle budgetten ophalen
router.get("/", (req, res) => {
  try {
    const budgets = db
      .prepare(
        `
      SELECT id, month, total_budget
      FROM budgets
      ORDER BY month DESC
    `
      )
      .all();

    res.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// POST /budgets → nieuw budget toevoegen
router.post("/", (req, res) => {
  try {
    const { month, total_budget } = req.body;

    if (!month || !total_budget) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO budgets (month, total_budget)
      VALUES (?, ?)
    `);

    const result = stmt.run(month, total_budget);

    res.json({
      id: result.lastInsertRowid,
      month,
      total_budget,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ error: "Failed to create budget" });
  }
});

export default router;
