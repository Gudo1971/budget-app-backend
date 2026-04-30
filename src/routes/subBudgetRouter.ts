import { Router } from "express";
import { pool } from "../lib/db";

export const subBudgetRouter = Router();

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */
type SubBudgetRow = {
  id: number;
  user_id: string;
  month: string;
  category_id: number;
  amount: number;
  created_at: string;
  updated_at: string;
};

/* -------------------------------------------------------
   GET — alle sub‑budgetten voor een maand
------------------------------------------------------- */
subBudgetRouter.get("/:month", async (req, res) => {
  const { month } = req.params;
  const userId = String(req.query.user_id);

  if (!userId) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT sb.*, 
             c.name AS category_name, 
             c.type AS category_type, 
             c.color AS category_color
      FROM sub_budgets sb
      JOIN categories c ON c.id = sb.category_id
      WHERE sb.month = $1 AND sb.user_id = $2
      ORDER BY c.name ASC
      `,
      [month, userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /sub-budgets error:", err);
    res.status(500).json({ error: "Failed to fetch sub-budgets" });
  }
});

/* -------------------------------------------------------
   CREATE — nieuw sub‑budget
------------------------------------------------------- */
subBudgetRouter.post("/", async (req, res) => {
  const { user_id, month, category_id, amount } = req.body;

  if (!user_id || !month || !category_id) {
    return res.status(400).json({
      error: "user_id, month and category_id are required",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO sub_budgets (user_id, month, category_id, amount)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [user_id, month, category_id, amount ?? 0],
    );

    res.json({
      id: result.rows[0].id,
      user_id,
      month,
      category_id,
      amount: amount ?? 0,
    });
  } catch (err) {
    console.error("POST /sub-budgets error:", err);
    res.status(500).json({ error: "Failed to create sub-budget" });
  }
});

/* -------------------------------------------------------
   UPDATE — sub‑budget aanpassen
------------------------------------------------------- */
subBudgetRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id, amount, category_id } = req.body;

  if (!user_id || amount == null || category_id == null) {
    return res.status(400).json({
      error: "user_id, amount and category_id are required",
    });
  }

  try {
    await pool.query(
      `
      UPDATE sub_budgets
      SET amount = $1, category_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      `,
      [amount, category_id, id, user_id],
    );

    res.json({ id, user_id, amount, category_id });
  } catch (err) {
    console.error("PUT /sub-budgets error:", err);
    res.status(500).json({ error: "Failed to update sub-budget" });
  }
});

/* -------------------------------------------------------
   DELETE — sub‑budget verwijderen + transacties verplaatsen
------------------------------------------------------- */
subBudgetRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = String(req.query.user_id);

  if (!userId) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // 1. Haal sub-budget op
    const subResult = await pool.query(
      `
      SELECT * FROM sub_budgets 
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    );

    const subBudget = subResult.rows[0] as SubBudgetRow | undefined;

    if (!subBudget) {
      return res.status(404).json({ error: "Sub-budget not found" });
    }

    // 2. Zoek Overig categorie
    const overigResult = await pool.query(
      `
      SELECT id FROM categories 
      WHERE user_id = $1 AND name = 'Overig'
      LIMIT 1
      `,
      [userId],
    );

    const overig = overigResult.rows[0] as { id: number } | undefined;

    if (!overig) {
      return res.status(500).json({
        error: "Overig category not found for this user",
      });
    }

    // 3. Verplaats transacties naar Overig
    await pool.query(
      `
      UPDATE transactions
      SET category_id = $1
      WHERE category_id = $2 AND user_id = $3
      `,
      [overig.id, subBudget.category_id, userId],
    );

    // 4. Verwijder sub-budget
    await pool.query(
      `
      DELETE FROM sub_budgets 
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /sub-budgets error:", err);
    res.status(500).json({ error: "Failed to delete sub-budget" });
  }
});
