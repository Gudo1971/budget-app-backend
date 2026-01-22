import { findCategoryIdByName } from "../../categories/category.service";
import { db } from "../../../lib/db";

export function createFixedCost(data: {
  name: string;
  amount: number;
  interval: string;
}) {
  const categoryId = findCategoryIdByName(data.name);

  const insert = db
    .prepare(
      "INSERT INTO fixed_costs (name, amount, interval, category_id) VALUES (?, ?, ?, ?)",
    )
    .run(data.name, data.amount, data.interval, categoryId);

  return insert.lastInsertRowid as number;
}
