import { pool } from "./db";

export async function findBudgetForCategory(categoryName: string) {
  const result = await pool.query(
    `
    SELECT b.id, b.month, b.total_budget, b.remaining
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE LOWER(c.name) = LOWER($1)
    `,
    [categoryName],
  );

  return result.rows[0] || null;
}
