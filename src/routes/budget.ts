import { Router } from "express";
import { pool } from "../lib/db";

const router = Router();

/* -------------------------------------------
   GET ALL BUDGETS
------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const budgetsResult = await pool.query(`
      SELECT id, month, total_budget, remaining
      FROM budgets
      ORDER BY month DESC
    `);

    const budgets = [];

    for (const row of budgetsResult.rows) {
      const subResult = await pool.query(
        `
        SELECT 
          sb.id,
          sb.category_id,
          sb.amount,
          c.name AS category_name,
          c.color AS category_color
        FROM sub_budgets sb
        JOIN categories c ON c.id = sb.category_id
        WHERE sb.month = $1
        `,
        [row.month],
      );

      budgets.push({
        ...row,
        subBudgets: subResult.rows,
      });
    }

    res.json(budgets);
  } catch (err) {
    console.error("GET /budgets error:", err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

/* -------------------------------------------
   GET BUDGET BY MONTH
------------------------------------------- */
router.get("/:month", async (req, res) => {
  const { month } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, month, total_budget, remaining
      FROM budgets
      WHERE month = $1
      `,
      [month],
    );

    const row = result.rows[0];

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
      row.remaining === null ? row.total_budget : row.remaining;

    const subResult = await pool.query(
      `
      SELECT id, category_id, amount
      FROM sub_budgets
      WHERE month = $1
      `,
      [month],
    );

    res.json({
      id: row.id,
      month: row.month,
      total_budget: row.total_budget,
      remaining: normalizedRemaining,
      subBudgets: subResult.rows,
    });
  } catch (err) {
    console.error("GET /budget/:month error:", err);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

/* -------------------------------------------
   CREATE OR UPDATE BUDGET
------------------------------------------- */
router.post("/", async (req, res) => {
  const { month, total_budget, remaining } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO budgets (month, total_budget, remaining)
      VALUES ($1, $2, $3)
      ON CONFLICT (month) DO UPDATE SET
        total_budget = EXCLUDED.total_budget,
        remaining = EXCLUDED.remaining
      `,
      [month, total_budget, remaining],
    );

    const result = await pool.query(
      `
      SELECT id, month, total_budget, remaining
      FROM budgets
      WHERE month = $1
      `,
      [month],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /budget error:", err);
    res.status(500).json({ error: "Failed to create/update budget" });
  }
});

/* -------------------------------------------
   UPDATE BUDGET
------------------------------------------- */
router.put("/:month", async (req, res) => {
  const { month } = req.params;
  const { total_budget, remaining } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO budgets (month, total_budget, remaining)
      VALUES ($1, $2, $3)
      ON CONFLICT (month) DO UPDATE SET
        total_budget = EXCLUDED.total_budget,
        remaining = EXCLUDED.remaining
      `,
      [month, total_budget, remaining],
    );

    const result = await pool.query(
      `
      SELECT id, month, total_budget, remaining
      FROM budgets
      WHERE month = $1
      `,
      [month],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /budget error:", err);
    res.status(500).json({ error: "Failed to update budget" });
  }
});

/* -------------------------------------------
   DISTRIBUTE ROLL OVER + SAVING
------------------------------------------- */
router.post("/:month/distribute", async (req, res) => {
  const { month } = req.params;
  const { rollover, savings } = req.body;

  try {
    const currentResult = await pool.query(
      `SELECT * FROM budgets WHERE month = $1`,
      [month],
    );

    const current = currentResult.rows[0];
    if (!current) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const [year, m] = month.split("-");
    const nextMonth =
      Number(m) === 12
        ? `${Number(year) + 1}-01`
        : `${year}-${String(Number(m) + 1).padStart(2, "0")}`;

    if (rollover > 0) {
      await pool.query(
        `
        INSERT INTO budgets (month, total_budget, remaining)
        VALUES ($1, $2, $2)
        ON CONFLICT (month) DO UPDATE SET
          total_budget = budgets.total_budget + EXCLUDED.total_budget,
          remaining = budgets.remaining + EXCLUDED.remaining
        `,
        [nextMonth, rollover],
      );
    }

    if (savings > 0) {
      await pool.query(
        `
        INSERT INTO savings (month, amount, source_month)
        VALUES ($1, $2, $3)
        `,
        [month, savings, month],
      );
    }

    await pool.query(
      `
      UPDATE budgets
      SET remaining = 0
      WHERE month = $1
      `,
      [month],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /budget/distribute error:", err);
    res.status(500).json({ error: "Failed to distribute remaining" });
  }
});

/* -------------------------------------------
   ROLLOVER
------------------------------------------- */
router.post("/rollover/:month", async (req, res) => {
  const { month } = req.params;

  try {
    const currentResult = await pool.query(
      `
      SELECT month, total_budget, remaining
      FROM budgets
      WHERE month = $1
      `,
      [month],
    );

    const current = currentResult.rows[0];
    if (!current) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const remaining = current.remaining;
    if (remaining <= 0) {
      return res
        .status(400)
        .json({ error: "No remaining budget to roll over" });
    }

    const [year, m] = month.split("-").map(Number);
    const nextMonth =
      m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;

    await pool.query(
      `
      INSERT INTO budgets (month, total_budget, remaining)
      VALUES ($1, 0, 0)
      ON CONFLICT (month) DO NOTHING
      `,
      [nextMonth],
    );

    await pool.query(
      `
      UPDATE budgets
      SET total_budget = total_budget + $1
      WHERE month = $2
      `,
      [remaining, nextMonth],
    );

    res.json({
      success: true,
      from: month,
      to: nextMonth,
      amount: remaining,
    });
  } catch (err) {
    console.error("POST /budget/rollover error:", err);
    res.status(500).json({ error: "Failed to roll over budget" });
  }
});

/* -------------------------------------------
   COPY BUDGET
------------------------------------------- */
router.post("/copy/:from/:to", async (req, res) => {
  const { from, to } = req.params;

  try {
    const prevResult = await pool.query(
      `
      SELECT total_budget, remaining
      FROM budgets
      WHERE month = $1
      `,
      [from],
    );

    const prev = prevResult.rows[0];
    if (!prev) return res.status(404).json(null);

    await pool.query(
      `
      INSERT INTO budgets (month, total_budget, remaining)
      VALUES ($1, $2, $3)
      ON CONFLICT (month) DO UPDATE SET
        total_budget = EXCLUDED.total_budget,
        remaining = EXCLUDED.remaining
      `,
      [to, prev.total_budget, prev.remaining],
    );

    const newResult = await pool.query(
      `
      SELECT id, month, total_budget, remaining
      FROM budgets
      WHERE month = $1
      `,
      [to],
    );

    res.json(newResult.rows[0]);
  } catch (err) {
    console.error("POST /budget/copy error:", err);
    res.status(500).json({ error: "Failed to copy budget" });
  }
});

export default router;
