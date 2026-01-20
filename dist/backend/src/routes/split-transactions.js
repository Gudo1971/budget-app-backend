"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitTransactionsRouter = void 0;
const zod_1 = require("zod");
const client_1 = require("../ai/engine/client");
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
// Schema voor AI-analyse van één item
const ItemAnalysisSchema = zod_1.z.object({
    suggested_category: zod_1.z.string(),
    confidence: zod_1.z.number(),
    reason: zod_1.z.string(),
});
router.post("/ai", async (req, res) => {
    try {
        const { transaction_id, items } = req.body;
        if (!transaction_id || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Invalid payload" });
        }
        const transaction = db_1.db
            .prepare(`SELECT * FROM transactions WHERE id = ?`)
            .get(transaction_id);
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
            const response = await client_1.openai.responses.parse({
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
    }
    catch (error) {
        console.error("Error splitting transaction with AI:", error);
        res.status(500).json({ error: "Failed to split transaction with AI" });
    }
});
exports.splitTransactionsRouter = router;
