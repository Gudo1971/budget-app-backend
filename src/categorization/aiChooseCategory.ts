import OpenAI from "openai";

const client = new OpenAI();

export async function aiChooseCategory(
  merchantName: string,
  description: string,
  categories: string[],
): Promise<string> {
  const prompt = `
Je bent een categorisatie-assistent voor een budget-app.
Kies de BESTE categorie voor deze transactie.

Merchant: ${merchantName}
Omschrijving: ${description}

Beschikbare categorieën:
${categories.map((c: string) => `- ${c}`).join("\n")}

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
