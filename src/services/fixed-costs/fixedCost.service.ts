import { db } from "../../lib/db";
import { findOrCreateCategory } from "../categories/category.service";

export function createFixedCost(data: {
  name: string;
  amount: number;
  interval: string;
}) {
  const categoryId = findOrCreateCategory(data.name);

  const insert = db
    .prepare(
      "INSERT INTO fixed_costs (name, amount, interval, category_id) VALUES (?, ?, ?, ?)"
    )
    .run(data.name, data.amount, data.interval, categoryId);

  return insert.lastInsertRowid as number;
}
