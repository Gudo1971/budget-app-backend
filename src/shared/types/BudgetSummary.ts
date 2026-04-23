export interface BudgetSummary {
  month: string; // "2026-04"
  total: number; // totaalbudget
  spent: number; // totaal uitgegeven
  remaining: number; // total - spent
  subBudgetCount: number; // aantal subbudgetten
}
