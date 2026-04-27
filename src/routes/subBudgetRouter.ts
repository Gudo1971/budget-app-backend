import { Router } from "express";
import { db } from "../lib/db";

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
subBudgetRouter.get("/:month", (req, res) => {
  const { month } = req.params;
  const userId = String(req.query.user_id);

  if (!userId) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const stmt = db.prepare(`
    SELECT sb.*, 
           c.name AS category_name, 
           c.type AS category_type, 
           c.color AS category_color
    FROM sub_budgets sb
    JOIN categories c ON c.id = sb.category_id
    WHERE sb.month = ? AND sb.user_id = ?
    ORDER BY c.name ASC
  `);

  const rows = stmt.all(month, userId);

  res.json(rows);
});

/* -------------------------------------------------------
   CREATE — nieuw sub‑budget
------------------------------------------------------- */
subBudgetRouter.post("/", (req, res) => {
  const { user_id, month, category_id, amount } = req.body;

  if (!user_id || !month || !category_id) {
    return res.status(400).json({
      error: "user_id, month and category_id are required",
    });
  }

  const stmt = db.prepare(`
    INSERT INTO sub_budgets (user_id, month, category_id, amount)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(user_id, month, category_id, amount ?? 0);

  res.json({
    id: result.lastInsertRowid,
    user_id,
    month,
    category_id,
    amount: amount ?? 0,
  });
});

/* -------------------------------------------------------
   UPDATE — sub‑budget aanpassen
------------------------------------------------------- */
subBudgetRouter.put("/:id", (req, res) => {
  const { id } = req.params;
  const { user_id, amount, category_id } = req.body;

  if (!user_id || amount == null || category_id == null) {
    return res.status(400).json({
      error: "user_id, amount and category_id are required",
    });
  }

  const stmt = db.prepare(`
    UPDATE sub_budgets
    SET amount = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(amount, category_id, id, user_id);

  res.json({ id, user_id, amount, category_id });
});

/* -------------------------------------------------------
   DELETE — sub‑budget verwijderen + transacties verplaatsen
------------------------------------------------------- */
subBudgetRouter.delete("/:id", (req, res) => {
  const { id } = req.params;
  const userId = String(req.query.user_id);

  if (!userId) {
    return res.status(400).json({ error: "user_id is required" });
  }

  // 1. Haal sub-budget op
  const subBudget = db
    .prepare(
      `
      SELECT * FROM sub_budgets WHERE id = ? AND user_id = ?
    `,
    )
    .get(id, userId) as SubBudgetRow | undefined;

  if (!subBudget) {
    return res.status(404).json({ error: "Sub-budget not found" });
  }

  // 2. Zoek Overig categorie
  const overig = db
    .prepare(
      `
      SELECT id FROM categories 
      WHERE user_id = ? AND name = 'Overig' 
      LIMIT 1
    `,
    )
    .get(userId) as { id: number } | undefined;

  if (!overig) {
    return res.status(500).json({
      error: "Overig category not found for this user",
    });
  }

  // 3. Verplaats transacties naar Overig
  db.prepare(
    `
    UPDATE transactions
    SET category_id = ?
    WHERE category_id = ? AND user_id = ?
  `,
  ).run(overig.id, subBudget.category_id, userId);

  // 4. Verwijder sub-budget
  db.prepare(
    `
    DELETE FROM sub_budgets 
    WHERE id = ? AND user_id = ?
  `,
  ).run(id, userId);

  res.json({ success: true });
});
