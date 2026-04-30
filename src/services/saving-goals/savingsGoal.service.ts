import { pool } from "../../lib/db";

export async function savingGoalService(data: {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  user_id?: string;
}) {
  const result = await pool.query(
    "INSERT INTO savings_goals (name, target_amount, current_amount, deadline, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [
      data.name,
      data.target_amount,
      data.current_amount,
      data.deadline,
      data.user_id || "demo-user",
    ],
  );

  return result.rows[0].id as number;
}
