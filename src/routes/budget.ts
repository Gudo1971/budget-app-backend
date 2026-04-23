import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

/* -------------------------------------------
   GET ALL BUDGETS
------------------------------------------- */
router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT id, month, total_budget
      FROM budgets
      ORDER BY month DESC
    `,
    )
    .all() as { id: number; month: string; total_budget: number }[];

  const budgets = rows.map((row) => {
    const subBudgets = db
      .prepare(
        `
        SELECT 
          sb.id,
          sb.category_id,
          sb.amount,
          c.name AS category_name,
          c.color AS category_color
        FROM sub_budgets sb
        JOIN categories c ON c.id = sb.category_id
        WHERE sb.month = ?
      `,
      )
      .all(row.month);

    return {
      ...row,
      subBudgets,
    };
  });

  res.json(budgets);
});

/* -------------------------------------------
   GET BUDGET BY ID
------------------------------------------- */
router.get("/by-id/:id", (req, res) => {
  const { id } = req.params;

  const row = db
    .prepare(
      `
      SELECT id, month, total_budget
      FROM budgets
      WHERE id = ?
    `,
    )
    .get(id) as { id: number; month: string; total_budget: number } | undefined;

  if (!row) {
    return res.json({
      id: null,
      month: null,
      total_budget: 0,
      subBudgets: [],
    });
  }

  const subBudgets = db
    .prepare(
      `
      SELECT 
        sb.id,
        sb.category_id,
        sb.amount,
        c.name AS category_name,
        c.color AS category_color
      FROM sub_budgets sb
      JOIN categories c ON c.id = sb.category_id
      WHERE sb.month = ?
    `,
    )
    .all(row.month);

  res.json({
    ...row,
    subBudgets,
  });
});

/* -------------------------------------------
   GET BUDGET BY MONTH
------------------------------------------- */
router.get("/:month", (req, res) => {
  const { month } = req.params;

  const row = db
    .prepare(
      `
      SELECT id, month, total_budget
      FROM budgets
      WHERE month = ?
    `,
    )
    .get(month) as
    | { id: number; month: string; total_budget: number }
    | undefined;

  if (!row) {
    return res.json({
      id: null,
      month,
      total_budget: 0,
      subBudgets: [],
    });
  }

  const subBudgets = db
    .prepare(
      `
      SELECT 
        sb.id,
        sb.category_id,
        sb.amount,
        c.name AS category_name,
        c.color AS category_color
      FROM sub_budgets sb
      JOIN categories c ON c.id = sb.category_id
      WHERE sb.month = ?
    `,
    )
    .all(month);

  res.json({
    ...row,
    subBudgets,
  });
});

/* -------------------------------------------
   CREATE BUDGET
------------------------------------------- */
router.post("/", (req, res) => {
  const { month, total_budget } = req.body;

  db.prepare(
    `
    INSERT INTO budgets (month, total_budget)
    VALUES (?, ?)
  `,
  ).run(month, total_budget);

  const created = db
    .prepare(
      `
    SELECT id, month, total_budget
    FROM budgets
    WHERE month = ?
  `,
    )
    .get(month);

  res.json(created);
});

/* -------------------------------------------
   UPDATE BUDGET
------------------------------------------- */
router.put("/:month", (req, res) => {
  const { month } = req.params;
  const { total_budget } = req.body;

  const existing = db
    .prepare(`SELECT id FROM budgets WHERE month = ?`)
    .get(month);

  if (existing) {
    db.prepare(`UPDATE budgets SET total_budget = ? WHERE month = ?`).run(
      total_budget,
      month,
    );
  } else {
    db.prepare(`INSERT INTO budgets (month, total_budget) VALUES (?, ?)`).run(
      month,
      total_budget,
    );
  }

  const updated = db
    .prepare(`SELECT id, month, total_budget FROM budgets WHERE month = ?`)
    .get(month);

  res.json(updated);
});

/* -------------------------------------------
   COPY BUDGET
------------------------------------------- */
router.post("/copy/:from/:to", (req, res) => {
  const { from, to } = req.params;

  const prev = db
    .prepare(
      `
      SELECT total_budget
      FROM budgets
      WHERE month = ?
    `,
    )
    .get(from) as { total_budget: number } | undefined;

  if (!prev) return res.status(404).json(null);

  db.prepare(
    `
      INSERT INTO budgets (month, total_budget)
      VALUES (?, ?)
      ON CONFLICT(month) DO UPDATE SET total_budget = excluded.total_budget
    `,
  ).run(to, prev.total_budget);

  const newBudget = db
    .prepare(
      `
      SELECT id, month, total_budget
      FROM budgets
      WHERE month = ?
    `,
    )
    .get(to);

  res.json(newBudget);
});

export default router;
