import { pool } from "../../lib/db";
import { findCategoryIdByName } from "../categories/category.service";

export async function createBudget(data: {
  category: string;
  amount: number;
  period: string;
}) {
  const categoryId = await findCategoryIdByName(data.category);

  if (!categoryId) {
    throw new Error(`Category not found: ${data.category}`);
  }

  const result = await pool.query(
    "INSERT INTO budgets (category_id, amount, period) VALUES ($1, $2, $3) RETURNING id",
    [categoryId, data.amount, data.period],
  );

  return result.rows[0].id as number;
}
