import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function aiCategorize(merchant: string): Promise<string | null> {
  if (!merchant) return null;

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
  } catch (err) {
    console.error("AI categorization error:", err);
    return null;
  }
}
