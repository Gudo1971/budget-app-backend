import { db } from "./db";

export function findBudgetForCategory(categoryName: string) {
  const row = db
    .prepare(
      `
      SELECT b.id, b.name, b.limit, b.category_id
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      WHERE LOWER(c.name) = LOWER(?)
    `
    )
    .get(categoryName);

  return row || null;
}
