// Merchant → category_id
export const CATEGORY_MAP: Record<string, number> = {
  albert_heijn: 1,
  jumbo: 1,
  lidl: 1,
  plus: 1,

  mcdonalds: 2,
  thuisbezorgd: 2,
  starbucks: 2,

  kruidvat: 3,
  etos: 3,
  rituals: 3,

  ns: 4,
  arriva: 4,
  uber: 4,

  apotheek: 5,
  huisarts: 5,

  overig: 6, // fallback
};

// category_id → label (UI)
export const CATEGORY_LABELS: Record<number, string> = {
  1: "Boodschappen",
  2: "Horeca",
  3: "Persoonlijke verzorging",
  4: "Vervoer",
  5: "Gezondheid",
  6: "Abonnementen",
  7: "Woonkosten",
  8: "Overig",
};

// category_name → category_id (AI)
export const CATEGORY_NAME_TO_ID: Record<string, number> = {
  boodschappen: 1,
  horeca: 2,
  "persoonlijke verzorging": 3,
  vervoer: 4,
  gezondheid: 5,
  overig: 6,
};
