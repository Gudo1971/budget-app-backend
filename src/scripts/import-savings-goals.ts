import fs from "fs";
import { parseCsv } from "../scripts/csv.parser";
import { savingGoalService } from "../services/saving-goals/savingsGoal.service";

export async function importSavingsGoalsCsv(
  path: string,
  userId: string = "demo-user",
) {
  const buffer = fs.readFileSync(path);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    await savingGoalService({
      name: row.name,
      target_amount: Number(row.target_amount),
      current_amount: Number(row.current_amount),
      deadline: row.deadline,
      user_id: userId,
    });
  }

  console.log("Savings goals imported:", rows.length);
}
