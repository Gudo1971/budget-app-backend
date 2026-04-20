import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

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
    .get(month);

  if (!row) return res.status(404).json(null);

  res.json(row);
});

// POST nieuw budget
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

  db.prepare(
    `
    UPDATE budgets
    SET total_budget = ?
    WHERE month = ?
  `,
  ).run(total_budget, month);

  const updated = db
    .prepare(
      `
    SELECT id, month, total_budget
    FROM budgets
    WHERE month = ?
  `,
    )
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
