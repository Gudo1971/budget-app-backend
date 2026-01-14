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

// ⭐ POST: CSV import
router.post("/", (req, res) => {
  console.log("RAW BODY:", req.body);

  const result = transactionService.create({
    source: req.body.source,
    receiptId: req.body.receiptId,
    extracted: req.body.extracted,
    form: req.body.form,
  });

  res.json(result);
});

// ⭐ POST: from extracted receipt
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
