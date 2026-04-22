import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// GET budget voor maand
// GET budget voor maand
// GET budget voor maand
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

  // ⭐ Type voor JOIN-resultaat
  interface SubBudgetRow {
    id: number;
    category_id: number;
    amount: number;
    category_name: string;
    category_color: string;
  }

  // ⭐ Subbudgetten + category ophalen
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
    .all(month) as SubBudgetRow[];

  const mapped = subBudgets.map((row) => ({
    id: row.id,
    category_id: row.category_id,
    amount: row.amount,
    category_name: row.category_name,
    category_color: row.category_color,
  }));

  res.json({
    ...row,
    subBudgets: mapped,
  });
});
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

// PUT update budget
router.put("/:month", (req, res) => {
  const { month } = req.params;
  const { total_budget } = req.body;

  // Check of budget bestaat
  const existing = db
    .prepare(`SELECT id FROM budgets WHERE month = ?`)
    .get(month);

  if (existing) {
    // UPDATE
    db.prepare(`UPDATE budgets SET total_budget = ? WHERE month = ?`).run(
      total_budget,
      month,
    );
  } else {
    // INSERT
    db.prepare(`INSERT INTO budgets (month, total_budget) VALUES (?, ?)`).run(
      month,
      total_budget,
    );
  }

  // Return updated/created budget
  const updated = db
    .prepare(`SELECT id, month, total_budget FROM budgets WHERE month = ?`)
    .get(month);

  res.json(updated);
});

// COPY budget van vorige maand
// COPY budget van vorige maand
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
