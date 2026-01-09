import { Router } from "express";
import { categorizeTransactions } from "../../services/categories/categorizeService";

import type { Transaction } from "../../types/transactions";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { transactions } = req.body as { transactions: Transaction[] };

    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: "transactions must be an array" });
    }

    const result = await categorizeTransactions(transactions);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
