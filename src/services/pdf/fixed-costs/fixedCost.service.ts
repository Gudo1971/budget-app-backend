import { findCategoryIdByName } from "../../categories/category.service";
import { pool } from "../../../lib/db";

export async function createFixedCost(data: {
  name: string;
  amount: number;
  interval: string;
}) {
  const categoryId = await findCategoryIdByName(data.name);

  const result = await pool.query(
    "INSERT INTO fixed_costs (name, amount, interval, category_id) VALUES ($1, $2, $3, $4) RETURNING id",
    [data.name, data.amount, data.interval, categoryId],
  );

  return result.rows[0].id as number;
}
