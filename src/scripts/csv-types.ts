export type CsvType =
  | "transactions"
  | "categories"
  | "budgets"
  | "fixed_costs"
  | "savings_goals";

export function detectCsvType(filename: string): CsvType | null {
  if (filename.includes("transactions")) return "transactions";
  if (filename.includes("categories")) return "categories";
  if (filename.includes("budgets")) return "budgets";
  if (filename.includes("fixed_costs")) return "fixed_costs";
  if (filename.includes("savings_goals")) return "savings_goals";
  return null;
}
