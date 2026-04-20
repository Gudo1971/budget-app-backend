import { Router } from "express";
import { transactionService } from "../services/transactions/transactions.service";
import { resolveCategory } from "../services/categories/resolveCategory";
import { resolveMerchantMemory } from "../services/merchantMemory/service/resolveMerchantMemory";
import { db } from "../lib/db";

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

// ⭐ POST: Create transaction (AUTOMATIC CATEGORY)
router.post("/", async (req, res) => {
  try {
    const { amount, date, merchant, description, userId } = req.body;

    // 1. Merchant memory lookup
    const merchantResolved = await resolveMerchantMemory(userId, merchant);

    // 2. Category resolution
    const categoryResolved = resolveCategory(
      userId,
      merchant,
      description,
      amount,
    );

    // 3. Create transaction with resolved category
    const result = await transactionService.create({
      amount,
      date,
      merchant,
      description,
      category_id: categoryResolved.category_id,
      userId,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ POST / error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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

router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ error: "Missing category_id" });
    }

    db.prepare(
      `
      UPDATE transactions
      SET category_id = ?
      WHERE id = ?
    `,
    ).run(category_id, id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});
// ⭐ GET: Total income for a given month (YYYY-MM)
router.get("/income/:month", (req, res) => {
  try {
    const { month } = req.params;

    const row = db
      .prepare(
        `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE amount > 0
        AND transaction_date LIKE ?
      `,
      )
      .get(`${month}%`) as { total: number | null };

    res.json(row.total || 0);
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({ error: "Failed to fetch income" });
  }
});

export default router;
