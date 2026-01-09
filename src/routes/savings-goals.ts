import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /savings-goals → alle spaardoelen ophalen
router.get("/", (req, res) => {
  try {
    const goals = db
      .prepare(
        `
      SELECT id, name, target_amount, current_amount, deadline
      FROM savings_goals
      ORDER BY deadline ASC
    `
      )
      .all();

    res.json(goals);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    res.status(500).json({ error: "Failed to fetch savings goals" });
  }
});

// POST /savings-goals → nieuw spaardoel toevoegen
router.post("/", (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline } = req.body;

    if (!name || !target_amount || current_amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO savings_goals (name, target_amount, current_amount, deadline)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      target_amount,
      current_amount,
      deadline || null
    );

    res.json({
      id: result.lastInsertRowid,
      name,
      target_amount,
      current_amount,
      deadline,
    });
  } catch (error) {
    console.error("Error creating savings goal:", error);
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

export default router;
