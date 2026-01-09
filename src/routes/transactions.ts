import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

type TransactionRow = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id: number | null;
  category_name: string | null;
  category_type: string | null;
};

// GET /transactions → alle transacties ophalen
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT
        t.id,
        t.date,
        t.description,
        t.amount,
        t.category_id,
        c.name AS category_name,
        c.type AS category_type
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.date DESC
    `
      )
      .all() as TransactionRow[];

    const transactions = rows.map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      amount: r.amount,
      category_id: r.category_id,
      category: r.category_id
        ? {
            id: r.category_id,
            name: r.category_name!,
            type: r.category_type!,
          }
        : null,
    }));

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// POST /transactions → nieuwe transactie opslaan
router.post("/", (req, res) => {
  try {
    const { date, description, amount, category_id } = req.body;

    if (!date || !description || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (date, description, amount, category_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(date, description, amount, category_id || null);

    res.json({
      id: result.lastInsertRowid,
      date,
      description,
      amount,
      category_id,
      category: null, // wordt bij GET automatisch gevuld via JOIN
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

export default router;
