import { Router } from "express";
import { pool } from "../lib/db";

const router = Router();

// GET /savings-goals → alle spaardoelen ophalen
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, target_amount, current_amount, deadline
      FROM savings_goals
      ORDER BY deadline ASC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    res.status(500).json({ error: "Failed to fetch savings goals" });
  }
});

// POST /savings-goals → nieuw spaardoel toevoegen
router.post("/", async (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline } = req.body;

    if (!name || !target_amount || current_amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
      INSERT INTO savings_goals (name, target_amount, current_amount, deadline)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [name, target_amount, current_amount, deadline || null],
    );

    res.json({
      id: result.rows[0].id,
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
