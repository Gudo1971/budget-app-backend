import { Router } from "express";
import { db } from "../lib/db";

export const subBudgetRouter = Router();

/**
 * GET all sub-budgets for a given month
 * Example: GET /api/sub-budgets/2025-04
 */
subBudgetRouter.get("/:month", (req, res) => {
  const { month } = req.params;

  const stmt = db.prepare(`
    SELECT sb.*, c.name AS category_name, c.type AS category_type
    FROM sub_budgets sb
    JOIN categories c ON c.id = sb.category_id
    WHERE sb.month = ?
    ORDER BY c.name ASC
  `);

  const rows = stmt.all(month);
  res.json(rows);
});

/**
 * CREATE a new sub-budget
 * Example:
 * POST /api/sub-budgets
 * { month: "2025-04", category_id: 3, amount: 120 }
 */
subBudgetRouter.post("/", (req, res) => {
  const { month, category_id, amount } = req.body;

  if (!month || !category_id) {
    return res
      .status(400)
      .json({ error: "month and category_id are required" });
  }

  const stmt = db.prepare(`
    INSERT INTO sub_budgets (month, category_id, amount)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(month, category_id, amount ?? 0);

  res.json({
    id: result.lastInsertRowid,
    month,
    category_id,
    amount: amount ?? 0,
  });
});

/**
 * UPDATE a sub-budget amount
 * Example:
 * PUT /api/sub-budgets/5
 * { amount: 150 }
 */
subBudgetRouter.put("/:id", (req, res) => {
  const { id } = req.params;
  const { amount, category_id } = req.body;

  if (amount == null || category_id == null) {
    return res
      .status(400)
      .json({ error: "amount and category_id are required" });
  }

  const stmt = db.prepare(`
    UPDATE sub_budgets
    SET amount = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(amount, category_id, id);

  res.json({ id, amount, category_id });
});

/**
 * DELETE a sub-budget
 * Example:
 * DELETE /api/sub-budgets/5
 */
subBudgetRouter.delete("/:id", (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare(`DELETE FROM sub_budgets WHERE id = ?`);
  stmt.run(id);

  res.json({ success: true });
});
