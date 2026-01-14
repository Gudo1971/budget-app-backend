import OpenAI from "openai";

const client = new OpenAI();

export async function aiChooseCategory(
  merchantName: string,
  description: string
) {
  const prompt = `
Je bent een categorisatie-assistent voor een budget-app.
Je taak: kies de BESTE categorie voor deze transactie.

Merchant: ${merchantName}
Omschrijving: ${description}

Beschikbare categorieën:
- Boodschappen
- PersoonlijkeVerzorging
- Huishouden
- Vervoer
- Abonnementen
- VrijeTijd
- Wonen
- Inkomen
- Overig

Regels:
- Supermarkten → Boodschappen
- Drogist → PersoonlijkeVerzorging
- Kruidvat/Action → Huishouden
- NS/OV → Vervoer
- Streaming → Abonnementen
- Restaurants → VrijeTijd
- Huur → Wonen
- Salaris → Inkomen

Geef alleen de categorie terug, niets anders.
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (!content) {
    console.warn("AI returned no content, falling back to 'Overig'");
    return "Overig";
  }

  return content.trim();
}
