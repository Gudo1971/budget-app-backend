import { Router } from "express";
import { pool } from "../lib/db";

const router = Router();

// MARKERS voor MonthSelector
router.get("/:month/markers", async (req, res) => {
  try {
    const { month } = req.params;

    // 1. Heeft deze maand een budget?
    const budgetResult = await pool.query(
      `
      SELECT 1 FROM budgets
      WHERE month = $1
      LIMIT 1
      `,
      [month],
    );
    const hasBudget = budgetResult.rows.length > 0;

    // 2. Heeft deze maand transacties?
    const transactionsResult = await pool.query(
      `
      SELECT 1 FROM transactions
      WHERE transaction_date::text LIKE $1
      LIMIT 1
      `,
      [`${month}%`],
    );
    const hasTransactions = transactionsResult.rows.length > 0;

    // 3. Heeft deze maand income? (positieve bedragen)
    const incomeResult = await pool.query(
      `
      SELECT 1 FROM transactions
      WHERE amount > 0
      AND transaction_date::text LIKE $1
      LIMIT 1
      `,
      [`${month}%`],
    );
    const hasIncome = incomeResult.rows.length > 0;

    res.json({
      hasBudget,
      hasTransactions,
      hasIncome,
    });
  } catch (error) {
    console.error("Error fetching month markers:", error);
    res.status(500).json({ error: "Failed to fetch month markers" });
  }
});

export default router;
