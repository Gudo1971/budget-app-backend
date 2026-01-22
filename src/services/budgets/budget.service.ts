import { db } from "../../lib/db";
import { findCategoryIdByName } from "../categories/category.service";

export function createBudget(data: {
  category: string;
  amount: number;
  period: string;
}) {
  const categoryId = findCategoryIdByName(data.category);

  if (!categoryId) {
    throw new Error(`Category not found: ${data.category}`);
  }

  const insert = db
    .prepare(
      "INSERT INTO budgets (category_id, amount, period) VALUES (?, ?, ?)",
    )
    .run(categoryId, data.amount, data.period);

  return insert.lastInsertRowid as number;
}
