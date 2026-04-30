import { z } from "zod";
import { openai } from "../ai/engine/client";
import { Router } from "express";
import { pool } from "../lib/db";
import type { Transaction } from "../shared/types/Transaction";

const router = Router();

// Schema voor AI-analyse van één item
const ItemAnalysisSchema = z.object({
  suggested_category: z.string(),
  confidence: z.number(),
  reason: z.string(),
});

router.post("/ai", async (req, res) => {
  try {
    const { transaction_id, items } = req.body;

    if (!transaction_id || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const result = await pool.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [transaction_id],
    );

    const transaction = result.rows[0] as Transaction | undefined;

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

      const response = await openai.responses.parse({
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        schema: ItemAnalysisSchema,
      });

      analyzedItems.push({
        ...item,
        ai: response.output,
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

export const splitTransactionsRouter = router;
