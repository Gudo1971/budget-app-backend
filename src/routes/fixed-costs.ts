import { Router } from "express";
import { pool } from "../lib/db";

const router = Router();

// GET /fixed-costs → alle vaste lasten ophalen
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, amount, interval
      FROM fixed_costs
      ORDER BY name ASC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching fixed costs:", error);
    res.status(500).json({ error: "Failed to fetch fixed costs" });
  }
});

// POST /fixed-costs → nieuwe vaste last toevoegen
router.post("/", async (req, res) => {
  try {
    const { name, amount, interval } = req.body;

    if (!name || !amount || !interval) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ error: "Invalid interval value" });
    }

    const result = await pool.query(
      `
      INSERT INTO fixed_costs (name, amount, interval)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [name, amount, interval],
    );

    res.json({
      id: result.rows[0].id,
      name,
      amount,
      interval,
    });
  } catch (error) {
    console.error("Error creating fixed cost:", error);
    res.status(500).json({ error: "Failed to create fixed cost" });
  }
});

export default router;
