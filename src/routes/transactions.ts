import { Router } from "express";
import { pool } from "../lib/db";
import { transactionService } from "../services/transactions/transactions.service";
import { resolveCategory } from "../services/categories/resolveCategory";
import { resolveMerchantMemory } from "../services/merchantMemory/service/resolveMerchantMemory";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";

const router = Router();
console.log("🚀 transactions router loaded");

router.get("/debug", (req, res) => {
  res.json({ ok: true, route: "transactions router werkt" });
});

// ⭐ Mapping function
function mapTransaction(row: any) {
  const normalized = normalizeMerchant(row.merchant);

  return {
    id: row.id,
    date: row.transaction_date,
    description: row.description,
    amount: row.amount,
    merchant: normalized.display,
    receipt_id: row.receipt_id ?? null,
    category_id: row.category_id ?? null,
    subcategory_id: row.subcategory_id ?? null,
    recurring: row.recurring === 1 || row.recurring === true,
    receipt: row.receipt_id
      ? {
          url: `http://localhost:3001/uploads/${row.receipt_filename}`,
          thumbnail: null,
          aiResult: row.receipt_ai_result
            ? JSON.parse(row.receipt_ai_result)
            : null,
        }
      : null,
    userId: row.user_id,
  };
}

// ⭐ GET all transactions (with optional date filtering)
router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;

    // Geen filters → alles via service
    if (!from || !to) {
      const all = await transactionService.getAll();
      return res.json(all);
    }

    // Met filters → database query
    const result = await pool.query(
      `
      SELECT 
        t.id,
        t.receipt_id,
        t.amount,
        t.transaction_date,
        t.merchant,
        t.description,
        t.category_id,
        t.subcategory_id,
        t.user_id,
        t.recurring,
        r.filename AS receipt_filename,
        r.aiResult AS receipt_ai_result
      FROM transactions t
      LEFT JOIN receipts r ON r.id = t.receipt_id
      WHERE t.transaction_date >= $1
      AND t.transaction_date <= $2
      ORDER BY t.transaction_date DESC
      `,
      [from, to],
    );

    res.json({
      success: true,
      data: result.rows.map(mapTransaction),
      error: null,
    });
  } catch (error) {
    console.error("❌ Error filtering transactions:", error);
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to fetch filtered transactions",
    });
  }
});

// ⭐ POST: Create transaction (AUTOMATIC CATEGORY)
router.post("/", async (req, res) => {
  try {
    const { amount, date, merchant, description, userId } = req.body;

    // 1. Merchant memory lookup
    const merchantResolved = await resolveMerchantMemory(userId, merchant);

    // 2. Category resolution (ASYNC!)
    const categoryResolved = await resolveCategory(
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

// ⭐ PATCH: Update category
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ error: "Missing category_id" });
    }

    await pool.query(
      `
      UPDATE transactions
      SET category_id = $1
      WHERE id = $2
      `,
      [category_id, id],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// ⭐ PUT: Update transaction category (MoveTransactionModal)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, user_id } = req.body;

    if (!category_id || !user_id) {
      return res.status(400).json({ error: "Missing category_id or user_id" });
    }

    await pool.query(
      `
      UPDATE transactions
      SET category_id = $1
      WHERE id = $2 AND user_id = $3
      `,
      [category_id, id, user_id],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ PUT /transactions/:id error:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// ⭐ GET: Total income for a given month (YYYY-MM)
router.get("/income/:month", async (req, res) => {
  try {
    const { month } = req.params;

    const result = await pool.query(
      `
      SELECT SUM(amount) AS total
      FROM transactions
      WHERE amount > 0
      AND TO_CHAR(transaction_date, 'YYYY-MM') = $1
      `,
      [month],
    );

    res.json(result.rows[0].total || 0);
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({ error: "Failed to fetch income" });
  }
});

export default router;
