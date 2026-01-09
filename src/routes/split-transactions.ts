import { Router } from "express";
import { db } from "../lib/db";
import { openai } from "../lib/openai";

const router = Router();

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id?: number | null;
  category?: string | null;
};

type Category = {
  id: number;
  name: string;
  type: string; // "essential", "fun", "luxury", etc.
};

type BudgetCategory = {
  id: number;
  month: string;
  category_id: number;
  budget_amount: number;
  spent_amount: number;
};

// ---------------------------------------------------------
// Merchant rules (E9)
// ---------------------------------------------------------
function getMerchantRule(description: string) {
  const desc = description.toLowerCase();

  if (
    desc.includes("albert heijn") ||
    desc.includes("jumbo") ||
    desc.includes("lidl")
  ) {
    return { categoryName: "Groceries", categoryType: "essential" as const };
  }

  if (desc.includes("bol.com") || desc.includes("amazon")) {
    return { categoryName: "Shopping", categoryType: "luxury" as const };
  }

  if (
    desc.includes("thuisbezorgd") ||
    desc.includes("uber eats") ||
    desc.includes("deliveroo")
  ) {
    return { categoryName: "Takeout", categoryType: "fun" as const };
  }

  if (
    desc.includes("ns ") ||
    desc.includes("ov-chip") ||
    desc.includes("uber")
  ) {
    return { categoryName: "Transport", categoryType: "essential" as const };
  }

  return null;
}

// Haal categorie op basis van naam (voor merchant rules)
function findCategoryByName(name: string): Category | undefined {
  return db
    .prepare(`SELECT * FROM categories WHERE LOWER(name) = LOWER(?)`)
    .get(name) as Category | undefined;
}

// ---------------------------------------------------------
// Stress score berekening (E8)
// ---------------------------------------------------------
function calculateStressScore({
  amount,
  categoryType,
  budgetAmount,
  spentAmount,
  aiConfidence,
  merchantBoost,
}: {
  amount: number;
  categoryType: string | null;
  budgetAmount: number | null;
  spentAmount: number | null;
  aiConfidence: number;
  merchantBoost: number;
}) {
  let score = 0;

  if (amount > 50) score += 0.2;
  if (amount > 150) score += 0.4;

  if (categoryType === "luxury" || categoryType === "fun") score += 0.3;

  if (aiConfidence < 0.5) score += 0.2;

  if (budgetAmount !== null && spentAmount !== null) {
    if (spentAmount + amount > budgetAmount) {
      score += 0.5;
    }
  }

  score += merchantBoost;

  return Math.min(1, score);
}

// UI-friendly stress level + color (E10)
function mapStressToUi(stress: number) {
  if (stress < 0.33) {
    return { level: "low", color: "green" as const };
  }
  if (stress < 0.66) {
    return { level: "medium", color: "orange" as const };
  }
  return { level: "high", color: "red" as const };
}

// ---------------------------------------------------------
// POST /split-transactions  → items opslaan + budget + stress + merchant rules
// ---------------------------------------------------------
router.post("/", (req, res) => {
  try {
    const { transaction_id, items } = req.body;

    if (!transaction_id || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const transaction = db
      .prepare(`SELECT * FROM transactions WHERE id = ?`)
      .get(transaction_id) as Transaction;

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const month = transaction.date.slice(0, 7);

    const updateBudgetImpact = db.prepare(`
      UPDATE budget_categories
      SET spent_amount = spent_amount + ?
      WHERE month = ? AND category_id = ?
    `);

    const insert = db.prepare(`
      INSERT INTO split_transactions (transaction_id, item_name, amount, category_id, stress_score)
      VALUES (?, ?, ?, ?, ?)
    `);

    const results = items.map((item) => {
      let category: Category | undefined;

      // 1. Als frontend een category_id meestuurt → gebruik die
      if (item.category_id) {
        category = db
          .prepare(`SELECT * FROM categories WHERE id = ?`)
          .get(item.category_id) as Category | undefined;
      } else {
        // 2. Anders: merchant rules proberen
        const rule = getMerchantRule(transaction.description);
        if (rule) {
          const found = findCategoryByName(rule.categoryName);
          if (found) {
            category = found;
            item.category_id = found.id;
          }
        }
      }

      const budget = item.category_id
        ? (db
            .prepare(
              `
        SELECT * FROM budget_categories 
        WHERE month = ? AND category_id = ?
      `
            )
            .get(month, item.category_id) as BudgetCategory | undefined)
        : undefined;

      // Merchant boost voor stress (E9)
      const merchantRule = getMerchantRule(transaction.description);
      const merchantBoost = merchantRule
        ? merchantRule.categoryType === "luxury"
          ? 0.2
          : 0.1
        : 0;

      const stress = calculateStressScore({
        amount: item.amount,
        categoryType: category?.type ?? null,
        budgetAmount: budget?.budget_amount ?? null,
        spentAmount: budget?.spent_amount ?? null,
        aiConfidence: 1,
        merchantBoost,
      });

      const result = insert.run(
        transaction_id,
        item.item_name,
        item.amount,
        item.category_id || null,
        stress
      );

      if (item.category_id) {
        updateBudgetImpact.run(item.amount, month, item.category_id);
      }

      const ui = mapStressToUi(stress);

      return {
        id: result.lastInsertRowid,
        stress_score: stress,
        stress_level: ui.level,
        stress_color: ui.color,
        ...item,
      };
    });

    res.json({
      transaction_id,
      items: results,
    });
  } catch (error) {
    console.error("Error splitting transaction:", error);
    res.status(500).json({ error: "Failed to split transaction" });
  }
});

// ---------------------------------------------------------
// POST /split-transactions/ai  → AI analyse uitvoeren (E7/E8/E9 ready)
// ---------------------------------------------------------
router.post("/ai", async (req, res) => {
  try {
    const { transaction_id, items } = req.body;

    if (!transaction_id || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const transaction = db
      .prepare(`SELECT * FROM transactions WHERE id = ?`)
      .get(transaction_id) as Transaction;

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const analyzedItems = [];

    for (const item of items) {
      const prompt = `
Je bent een financieel analysemodel. Analyseer dit item binnen een transactie.

Transactie:
- Datum: ${transaction.date}
- Omschrijving: ${transaction.description}
- Bedrag totaal: ${transaction.amount}

Item:
- Naam: ${item.item_name}
- Bedrag: ${item.amount}

Geef terug in JSON:
{
  "suggested_category": "...",
  "confidence": number,
  "reason": "korte uitleg"
}
`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content!);

      analyzedItems.push({
        ...item,
        ai: analysis,
      });
    }

    res.json({
      transaction_id,
      items: analyzedItems,
    });
  } catch (error) {
    console.error("Error splitting transaction with AI:", error);
    res.status(500).json({ error: "Failed to split transaction with AI" });
  }
});

// ---------------------------------------------------------
// GET /split-transactions/:transaction_id  → items ophalen (incl. stress UI)
// ---------------------------------------------------------
router.get("/:transaction_id", (req, res) => {
  try {
    const { transaction_id } = req.params;

    const rows = db
      .prepare(
        `
      SELECT 
        st.id,
        st.item_name,
        st.amount,
        st.category_id,
        st.stress_score,
        c.name AS category_name,
        c.type AS category_type
      FROM split_transactions st
      LEFT JOIN categories c ON c.id = st.category_id
      WHERE st.transaction_id = ?
      ORDER BY st.id ASC
    `
      )
      .all(transaction_id) as Array<{
      id: number;
      item_name: string;
      amount: number;
      category_id: number | null;
      stress_score: number | null;
      category_name: string | null;
      category_type: string | null;
    }>;

    const items = rows.map((row) => {
      const stress = row.stress_score ?? 0;
      const ui = mapStressToUi(stress);

      return {
        id: row.id,
        item_name: row.item_name,
        amount: row.amount,
        category_id: row.category_id,
        category_name: row.category_name,
        category_type: row.category_type,
        stress_score: stress,
        stress_level: ui.level,
        stress_color: ui.color,
      };
    });

    res.json(items);
  } catch (error) {
    console.error("Error fetching split items:", error);
    res.status(500).json({ error: "Failed to fetch split items" });
  }
});

export default router;
