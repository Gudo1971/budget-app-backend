"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiCategorize = aiCategorize;
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function aiCategorize(merchant) {
    if (!merchant)
        return null;
    try {
        const prompt = `
      Categoriseer deze transactie op basis van de merchantnaam.
      Geef alleen de categorie terug, in één woord of korte term.
      Merchant: "${merchant}"
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10,
        });
        const category = response.choices[0].message.content?.trim();
        return category || null;
    }
    catch (err) {
        console.error("AI categorization error:", err);
        return null;
    }
}
