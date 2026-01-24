import { Router } from "express";
import { transactionService } from "../services/transactions/transactions.service";

const router = Router();
console.log("🚀 transactions router loaded");

router.get("/debug", (req, res) => {
  res.json({ ok: true, route: "transactions router werkt" });
});

// ⭐ GET all transactions
router.get("/", (req, res) => {
  const transactions = transactionService.getAll();
  res.json(transactions);
});

// ⭐ POST: Filtered transactions (PeriodSelector v2)
router.post("/filter", async (req, res) => {
  try {
    const period = req.body;

    if (!period.userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await transactionService.filter({
      userId: String(period.userId),

      // single
      year: period.year,
      month: period.month,

      // single week → convert to array
      weeks: period.week
        ? [String(period.week)]
        : period.weeks
          ? period.weeks.map(String)
          : undefined,

      // multi
      months: period.months,
      years: period.years,

      // custom
      from: period.from,
      to: period.to,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ POST /filter error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ⭐ POST: Create transaction
router.post("/", async (req, res) => {
  const result = await transactionService.create(req.body);
  res.json(result);
});

// ⭐ POST: from extracted receipt
router.post("/from-extracted", async (req, res) => {
  const result = await transactionService.create({
    receiptId: req.body.receiptId,
    extracted: req.body.extracted,
    form: req.body.form,
    source: "extracted-receipt",
  });

  res.json(result);
});

export default router;
