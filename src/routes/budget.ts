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
    SELECT id, month, total_budget, remaining
    FROM budgets
    ORDER BY month DESC
  `,
    )
    .all() as {
    id: number;
    month: string;
    total_budget: number;
    remaining: number;
  }[];

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
      .all(row.month) as {
      id: number;
      category_id: number;
      amount: number;
      category_name: string;
      category_color: string;
    }[];

    return { ...row, subBudgets };
  });

  res.json(budgets);
});

/* -------------------------------------------
   GET BUDGET BY MONTH
------------------------------------------- */
router.get("/:month", (req, res) => {
  const { month } = req.params;

  const row = db
    .prepare(
      `
      SELECT id, month, total_budget, remaining
      FROM budgets
      WHERE month = ?
    `,
    )
    .get(month) as
    | {
        id: number;
        month: string;
        total_budget: number;
        remaining: number | null;
      }
    | undefined;

  if (!row) {
    return res.json({
      id: null,
      month,
      total_budget: 0,
      remaining: 0,
      subBudgets: [],
    });
  }

  const normalizedRemaining =
    row.remaining === null || row.remaining === undefined
      ? row.total_budget
      : row.remaining;

  const subBudgets = db
    .prepare(
      `
      SELECT id, category_id, amount
      FROM sub_budgets
      WHERE month = ?
    `,
    )
    .all(month) as {
    id: number;
    category_id: number;
    amount: number;
  }[];

  return res.json({
    id: row.id,
    month: row.month,
    total_budget: row.total_budget,
    remaining: normalizedRemaining,
    subBudgets,
  });
});

/* -------------------------------------------
   CREATE OR UPDATE BUDGET
------------------------------------------- */
router.post("/", (req, res) => {
  const { month, total_budget, remaining } = req.body;
  console.log("POST /budget body:", req.body);
  db.prepare(
    `
    INSERT INTO budgets (month, total_budget, remaining)
    VALUES (?, ?, ?)
    ON CONFLICT(month) DO UPDATE SET
      total_budget = excluded.total_budget,
      remaining = excluded.remaining
  `,
  ).run(month, total_budget, remaining);

  const created = db
    .prepare(
      `
    SELECT id, month, total_budget, remaining
    FROM budgets
    WHERE month = ?
  `,
    )
    .get(month) as {
    id: number;
    month: string;
    total_budget: number;
    remaining: number;
  };

  res.json(created);
});

/* -------------------------------------------
   UPDATE BUDGET
------------------------------------------- */
router.put("/:month", (req, res) => {
  const { month } = req.params;
  const { total_budget, remaining } = req.body;
  console.log("PUT/budget body:", req.body);
  db.prepare(
    `
    INSERT INTO budgets (month, total_budget, remaining)
    VALUES (?, ?, ?)
    ON CONFLICT(month) DO UPDATE SET
      total_budget = excluded.total_budget,
      remaining = excluded.remaining
  `,
  ).run(month, total_budget, remaining);

  const updated = db
    .prepare(
      `
    SELECT id, month, total_budget, remaining
    FROM budgets
    WHERE month = ?
  `,
    )
    .get(month) as {
    id: number;
    month: string;
    total_budget: number;
    remaining: number;
  };

  res.json(updated);
});
/* -------------------------------------------
   DISTRIBUTE ROLL OVER + SAVING
------------------------------------------- */
router.post("/:month/distribute", async (req, res) => {
  const { month } = req.params;
  const { rollover, savings } = req.body;

  try {
    // 1) Huidige maand ophalen (met type!)
    const currentBudget = db
      .prepare("SELECT * FROM budgets WHERE month = ?")
      .get(month) as
      | {
          id: number;
          month: string;
          total_budget: number;
          remaining: number;
        }
      | undefined;

    if (!currentBudget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // 2) Volgende maand bepalen
    const [year, m] = month.split("-");
    const nextMonth =
      Number(m) === 12
        ? `${Number(year) + 1}-01`
        : `${year}-${String(Number(m) + 1).padStart(2, "0")}`;

    // 3) Rollover toevoegen
    if (rollover > 0) {
      db.prepare(
        `
        INSERT INTO budgets (month, total_budget, remaining)
        VALUES (?, ?, ?)
        ON CONFLICT(month) DO UPDATE SET
          total_budget = total_budget + excluded.total_budget,
          remaining = remaining + excluded.remaining
      `,
      ).run(nextMonth, rollover, rollover);
    }

    // 4) Savings opslaan
    if (savings > 0) {
      db.prepare(
        `
        INSERT INTO savings (month, amount, source_month)
        VALUES (?, ?, ?)
      `,
      ).run(month, savings, month);
    }

    // 5) Remaining resetten
    db.prepare(
      `
      UPDATE budgets
      SET remaining = 0
      WHERE month = ?
    `,
    ).run(month);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to distribute remaining" });
  }
});

/* -------------------------------------------
   ROLLOVER
------------------------------------------- */
router.post("/rollover/:month", (req, res) => {
  const { month } = req.params;

  const current = db
    .prepare(
      `
    SELECT month, total_budget, remaining
    FROM budgets
    WHERE month = ?
  `,
    )
    .get(month) as
    | {
        month: string;
        total_budget: number;
        remaining: number;
      }
    | undefined;

  if (!current) {
    return res.status(404).json({ error: "Budget not found" });
  }

  const remaining = current.remaining;

  if (remaining <= 0) {
    return res.status(400).json({ error: "No remaining budget to roll over" });
  }

  const [year, m] = month.split("-").map(Number);
  const nextMonth =
    m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;

  db.prepare(
    `
    INSERT INTO budgets (month, total_budget, remaining)
    VALUES (?, 0, 0)
    ON CONFLICT(month) DO NOTHING
  `,
  ).run(nextMonth);

  db.prepare(
    `
    UPDATE budgets
    SET total_budget = total_budget + ?
    WHERE month = ?
  `,
  ).run(remaining, nextMonth);

  res.json({
    success: true,
    from: month,
    to: nextMonth,
    amount: remaining,
  });
});

/* -------------------------------------------
   COPY BUDGET
------------------------------------------- */
router.post("/copy/:from/:to", (req, res) => {
  const { from, to } = req.params;

  const prev = db
    .prepare(
      `
    SELECT total_budget, remaining
    FROM budgets
    WHERE month = ?
  `,
    )
    .get(from) as
    | {
        total_budget: number;
        remaining: number;
      }
    | undefined;

  if (!prev) return res.status(404).json(null);
  console.log("POST /budget body:", req.body);

  db.prepare(
    `
    INSERT INTO budgets (month, total_budget, remaining)
    VALUES (?, ?, ?)
    ON CONFLICT(month) DO UPDATE SET
      total_budget = excluded.total_budget,
      remaining = excluded.remaining
  `,
  ).run(to, prev.total_budget, prev.remaining);

  const newBudget = db
    .prepare(
      `
    SELECT id, month, total_budget, remaining
    FROM budgets
    WHERE month = ?
  `,
    )
    .get(to) as {
    id: number;
    month: string;
    total_budget: number;
    remaining: number;
  };

  res.json(newBudget);
});

export default router;
