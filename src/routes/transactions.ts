import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

type TransactionRow = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id: number | null;
  category_name: string | null;
  category_type: string | null;
};

// GET /transactions → alle transacties ophalen
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT
        t.id,
        t.date,
        t.description,
        t.amount,
        t.category_id,
        c.name AS category_name,
        c.type AS category_type
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.date DESC
    `
      )
      .all() as TransactionRow[];

    const transactions = rows.map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      amount: r.amount,
      category_id: r.category_id,
      category: r.category_id
        ? {
            id: r.category_id,
            name: r.category_name!,
            type: r.category_type!,
          }
        : null,
    }));

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.get("/transactions/:id/receipt", (req, res) => {
  const id = req.params.id;

  const receipt = db
    .prepare(
      `
    SELECT r.*
    FROM receipts r
    JOIN transactions t ON t.receipt_id = r.id
    WHERE t.id = ?
  `
    )
    .get(id);

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json(receipt);
});

// POST /transactions → nieuwe transactie opslaan
router.post("/", (req, res) => {
  try {
    const { date, description, amount, category_id } = req.body;

    if (!date || !description || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (date, description, amount, category_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(date, description, amount, category_id || null);

    res.json({
      id: result.lastInsertRowid,
      date,
      description,
      amount,
      category_id,
      category: null, // wordt bij GET automatisch gevuld via JOIN
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});
import { extractTransaction } from "../ai/extractors/extractTransaction";

// POST /transactions/extract → AI transactie-extractie
router.post("/extract", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text field" });
    }

    const extracted = await extractTransaction(text);

    res.json({
      success: true,
      extracted,
    });
  } catch (error) {
    console.error("AI extraction error:", error);
    res.status(500).json({ error: "AI extraction failed" });
  }
});
router.post("/extract-and-save", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text field" });
    }

    const extracted = await extractTransaction(text);

    const stmt = db.prepare(`
      INSERT INTO transactions (date, description, amount, category_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      extracted.date || new Date().toISOString().slice(0, 10),
      extracted.merchant || extracted.category || "Unknown",
      extracted.amount,
      null // categorie wordt later bepaald
    );

    res.json({
      success: true,
      id: result.lastInsertRowid,
      extracted,
    });
  } catch (error) {
    console.error("AI extract+save error:", error);
    res.status(500).json({ error: "AI extract+save failed" });
  }
});
router.post("/from-extracted", (req, res) => {
  try {
    const { receiptId, extracted, form } = req.body;

    // 1. Basisvelden bepalen (zoals je nu al doet)
    const amount = form.amount ?? extracted.total ?? 0;
    const date = form.date ?? extracted.date ?? new Date().toISOString();
    const merchant = form.merchant ?? extracted.merchant ?? "Onbekend";

    // 2. Duplicate check op datum + bedrag + merchant
    const existing = db
      .prepare(
        `
        SELECT id FROM transactions
        WHERE date = ?
          AND amount = ?
          AND LOWER(merchant) = LOWER(?)
      `
      )
      .get(date, amount, merchant) as { id: number } | undefined;

    if (existing) {
      return res.status(409).json({
        error: "Duplicate transaction detected",
        transaction_id: existing.id,
      });
    }

    // 3. AI categorie (string)
    const raw = extracted.merchant_category?.trim() ?? null;
    const aiCategory = raw
      ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
      : null;

    // 4. category_id (van formulier of AI)
    let category_id = form.category_id ?? null;

    if (!category_id && aiCategory) {
      const existingCat = db
        .prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)")
        .get(aiCategory) as { id: number } | undefined;

      if (existingCat) {
        category_id = existingCat.id;
      } else {
        const insert = db
          .prepare("INSERT INTO categories (name, type) VALUES (?, ?)")
          .run(aiCategory, "variable") as { lastInsertRowid: number };

        category_id = insert.lastInsertRowid as number;
      }
    }

    // 5. Transactie opslaan
    const stmt = db.prepare(`
      INSERT INTO transactions (receipt_id, amount, date, merchant, category_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(receiptId, amount, date, merchant, category_id) as {
      lastInsertRowid: number;
    };

    // 6. Volledige categorie ophalen
    let category = null;
    if (category_id) {
      category = db
        .prepare("SELECT id, name, type FROM categories WHERE id = ?")
        .get(category_id) as { id: number; name: string; type: string };
    }

    // 7. Response
    res.json({
      id: result.lastInsertRowid,
      receiptId,
      amount,
      date,
      merchant,
      category_id,
      category,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

export default router;
