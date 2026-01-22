export function normalizeMerchant(raw: string | undefined): {
  key: string; // machine-friendly canonical key
  display: string; // human-friendly name for UI
} {
  if (!raw) return { key: "", display: "" };

  // 1. Lowercase + trim
  let m = raw.toLowerCase().trim();

  // 2. OCR cleanup
  m = m
    .replace(/[^a-z0-9& ]/g, "") // verwijder rommel
    .replace(/\s+/g, " ") // dubbele spaties → enkele
    .trim();

  // 3. Canonical alias mapping (machine-friendly)
  const ALIASES: Record<string, string> = {
    ah: "albertheijn",
    ahxl: "albertheijn",
    albert: "albertheijn",
    albertheijn: "albertheijn",

    jumbo: "jumbo",
    jumbosupermarkten: "jumbo",

    lidl: "lidl",

    mcdonalds: "mcdonalds",
    mcdo: "mcdonalds",

    yb: "yoghurtbarn",
    yoghurtbarn: "yoghurtbarn",
  };

  for (const key in ALIASES) {
    if (m.includes(key)) {
      m = ALIASES[key];
      break;
    }
  }

  const canonical = m;

  // 4. Human-friendly mapping
  const HUMAN_NAMES: Record<string, string> = {
    albertheijn: "Albert Heijn",
    jumbo: "Jumbo",
    yoghurtbarn: "Yoghurt Barn",
    etos: "Etos",
    gallgall: "Gall & Gall",
    kruidvat: "Kruidvat",
    aldi: "Aldi",
    lidl: "Lidl",
    mcdonalds: "McDonald’s",
  };

  const display =
    HUMAN_NAMES[canonical] ??
    canonical
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return { key: canonical, display };
}
