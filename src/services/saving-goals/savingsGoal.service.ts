import { db } from "../../lib/db";

export function savingGoalService(data: {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  user_id?: string;
}) {
  const insert = db
    .prepare(
      "INSERT INTO savings_goals (name, target_amount, current_amount, deadline, user_id) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      data.name,
      data.target_amount,
      data.current_amount,
      data.deadline,
      data.user_id || "demo-user",
    );

  return insert.lastInsertRowid as number;
}
