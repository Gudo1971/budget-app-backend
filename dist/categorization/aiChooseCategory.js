"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiChooseCategory = aiChooseCategory;
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default();
async function aiChooseCategory(merchantName, description, categories) {
    const prompt = `
Je bent een categorisatie-assistent voor een budget-app.
Kies de BESTE categorie voor deze transactie.

Merchant: ${merchantName}
Omschrijving: ${description}

Beschikbare categorieën:
${categories.map((c) => `- ${c}`).join("\n")}

Regels:
- Kies altijd één van de beschikbare categorieën.
- Als je twijfelt, kies de meest logische.
- Geef alleen de categorie terug, niets anders.
  `;
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });
    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
        console.warn("AI returned no content, falling back to first category");
        return categories[0] ?? "Overig";
    }
    return content.trim();
}
