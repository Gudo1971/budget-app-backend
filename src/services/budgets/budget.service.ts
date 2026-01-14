import { db } from "../../lib/db";
import { findOrCreateCategory } from "../categories/category.service";

export function createBudget(data: {
  category: string;
  amount: number;
  period: string;
}) {
  const categoryId = findOrCreateCategory(data.category);

  const insert = db
    .prepare(
      "INSERT INTO budgets (category_id, amount, period) VALUES (?, ?, ?)"
    )
    .run(categoryId, data.amount, data.period);

  return insert.lastInsertRowid as number;
}
