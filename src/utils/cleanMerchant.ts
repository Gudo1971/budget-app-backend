// backend/src/utils/cleanMerchant.ts

const KNOWN_MERCHANTS: Record<string, string> = {
  albertheijn: "Albert Heijn",
  ah: "Albert Heijn",
  "ah to go": "Albert Heijn To Go",
  jumbo: "Jumbo",
  "jumbo supermarkten": "Jumbo",
  yoghurtbarn: "Yoghurt Barn",
  etos: "Etos",
  "gall&gall": "Gall & Gall",
  "gall en gall": "Gall & Gall",
  kruidvat: "Kruidvat",
  aldi: "Aldi",
  lidll: "Lidl",
  lidl: "Lidl",
};

export function cleanMerchant(raw: string | undefined): string {
  if (!raw) return "";

  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9& ]/g, "") // verwijder OCR rommel
    .replace(/\s+/g, " ") // dubbele spaties
    .trim();

  // Bekende merchants
  if (KNOWN_MERCHANTS[cleaned]) {
    return KNOWN_MERCHANTS[cleaned];
  }

  // Capitalize fallback
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
