import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

// MARKERS voor MonthSelector
router.get("/:month/markers", (req, res) => {
  try {
    const { month } = req.params;

    // 1. Heeft deze maand een budget?
    const hasBudget = !!db
      .prepare(
        `
        SELECT 1 FROM budgets
        WHERE month = ?
        LIMIT 1
      `,
      )
      .get(month);

    // 2. Heeft deze maand transacties?
    const hasTransactions = !!db
      .prepare(
        `
        SELECT 1 FROM transactions
        WHERE transaction_date LIKE ?
        LIMIT 1
      `,
      )
      .get(`${month}%`);

    // 3. Heeft deze maand income? (positieve bedragen)
    const hasIncome = !!db
      .prepare(
        `
        SELECT 1 FROM transactions
        WHERE amount > 0
        AND transaction_date LIKE ?
        LIMIT 1
      `,
      )
      .get(`${month}%`);

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
