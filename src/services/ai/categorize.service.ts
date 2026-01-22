import OpenAI from "openai";
import { CATEGORY_LABELS } from "../categories/categoryMap";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function aiSuggestCategory(merchant: string): Promise<{
  category_id: number | null;
  confidence: number;
}> {
  if (!merchant) return { category_id: null, confidence: 0 };

  try {
    const allowedCategories = Object.entries(CATEGORY_LABELS)
      .map(([id, label]) => `${id}: ${label}`)
      .join("\n");

    const prompt = `
Je bent een categorisatie-assistent voor een budget-app.

Doel:
- Bepaal de juiste category_id op basis van de merchantnaam.
- Geef ALLEEN een JSON-object terug.
- Gebruik GEEN tekst buiten het JSON-object.

JSON structuur:
{
  "category_id": number | null,
  "confidence": number
}

Toegestane categorieën:
${allowedCategories}

Regels:
- Als je het niet zeker weet: category_id = null.
- confidence tussen 0 en 1.
- Geen uitleg, geen zinnen, alleen JSON.

Merchant: "${merchant}"
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
    });

    const raw = response.choices[0].message.content?.trim();
    if (!raw) return { category_id: null, confidence: 0 };

    const parsed = JSON.parse(raw);

    return {
      category_id: parsed.category_id ?? null,
      confidence: parsed.confidence ?? 0,
    };
  } catch (err) {
    console.error("AI categorization error:", err);
    return { category_id: null, confidence: 0 };
  }
}
