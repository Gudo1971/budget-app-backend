export const CATEGORY_CSV_MAP: Record<string, number> = {
  Boodschappen: 1,
  Horeca: 2,
  "Persoonlijke verzorging": 3,
  Vervoer: 4,
  Gezondheid: 5,
  Abonnementen: 6,
  Woonkosten: 7,
  Shopping: 8,
  Kinderen: 9,
  Telecom: 10,
  Uitjes: 11,
  Inkomen: 12,
  Overig: 13,
  Wonen: 7,

  // Varianten
  Drogist: 3,
  "Persoonlijke Verzorging": 3,

  HEMA: 8,
  Decathlon: 9,

  School: 9,
  Schoolbijdrage: 9,
  Kinderopvang: 9,

  "Internet & TV": 10,
  Telefoon: 10,

  Energie: 7,
  Water: 7,
  Huur: 7,

  Auto: 4,
  Benzine: 4,
  Wegenbelasting: 4,
  Autoverzekering: 4,
};

export function mapCsvCategory(name: string): number {
  if (!name) return 13; // Overig
  return CATEGORY_CSV_MAP[name.trim()] ?? 13;
}
