import { Router } from "express";
import { transactionService } from "../services/transactions/transaction.service";

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

router.post("/from-extracted", (req, res) => {
  const result = transactionService.create({
    receiptId: req.body.receiptId,
    extracted: req.body.extracted,
    form: req.body.form,
    source: "extracted",
  });

  res.json(result);
});

export default router;
