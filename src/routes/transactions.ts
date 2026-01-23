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

// ⭐ POST: Create transaction (supports both old & new format)
router.post("/", async (req, res) => {
  console.log("RAW BODY:", req.body);

  // ⭐ Doorgeven wat de frontend stuurt - service bepaalt format
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
