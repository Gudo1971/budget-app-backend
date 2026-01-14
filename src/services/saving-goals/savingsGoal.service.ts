import { db } from "../../lib/db";

export function savingGoalService(data: {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
}) {
  const insert = db
    .prepare(
      "INSERT INTO savings_goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)"
    )
    .run(data.name, data.target_amount, data.current_amount, data.deadline);

  return insert.lastInsertRowid as number;
}
