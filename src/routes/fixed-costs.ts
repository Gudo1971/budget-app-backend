import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /fixed-costs → alle vaste lasten ophalen
router.get("/", (req, res) => {
  try {
    const fixedCosts = db
      .prepare(
        `
      SELECT id, name, amount, interval
      FROM fixed_costs
      ORDER BY name ASC
    `
      )
      .all();

    res.json(fixedCosts);
  } catch (error) {
    console.error("Error fetching fixed costs:", error);
    res.status(500).json({ error: "Failed to fetch fixed costs" });
  }
});

// POST /fixed-costs → nieuwe vaste last toevoegen
router.post("/", (req, res) => {
  try {
    const { name, amount, interval } = req.body;

    if (!name || !amount || !interval) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ error: "Invalid interval value" });
    }

    const stmt = db.prepare(`
      INSERT INTO fixed_costs (name, amount, interval)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, amount, interval);

    res.json({
      id: result.lastInsertRowid,
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
