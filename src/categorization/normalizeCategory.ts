export const CATEGORY_MAP: Record<string, string> = {
  Dining: "Eten & Drinken",
  "Food & Drink": "Eten & Drinken",
  "Food & Drinks": "Eten & Drinken",
  Food: "Eten & Drinken",
  Drink: "Eten & Drinken",
  Restaurant: "Restaurant",
  Café: "Café",
  Groceries: "Boodschappen",
  Supermarket: "Boodschappen",
  Transportation: "Vervoer",
  Electronics: "Elektronica",
};

export function normalizeCategory(cat?: string | null): string {
  if (!cat) return "";
  return CATEGORY_MAP[cat] ?? cat;
}
