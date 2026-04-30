/**
 * Merchant normalization service - UNIFIED IMPLEMENTATION
 * Source of truth for all merchant name standardization
 *
 * Used by:
 * - Backend: transactions, receipts, categorization
 * - Frontend: transaction form initialization
 *
 * This ensures consistent merchant key derivation across the entire app.
 */

export function normalizeMerchant(raw: string | undefined): {
  key: string; // machine-friendly canonical key for lookup
  display: string; // human-friendly name for UI display
} {
  if (!raw) return { key: "", display: "" };

  // 1. Lowercase + trim
  let m = raw.toLowerCase().trim();

  // 2. OCR cleanup
  m = m
    .replace(/[^a-z0-9& ]/g, "") // remove junk
    .replace(/\s+/g, "") // remove ALL spaces for canonical key
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
    ikea: "IKEA",
    lidl: "Lidl",
    mcdonalds: "McDonald's",
  };

  const displayName = HUMAN_NAMES[canonical] || canonical;

  return {
    key: canonical,
    display: displayName,
  };
}
