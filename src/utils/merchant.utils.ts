// utils/merchant.utils.ts

/**
 * Unified merchant normalizer
 * -----------------------------------------
 * Doel:
 * - merchants consistent maken
 * - matching betrouwbaarder
 * - merchant_memory schoner
 * - categorisatie voorspelbaar
 * - receipts & transactions in één universum
 */

export function normalizeMerchant(raw: string): string {
  if (!raw) return "";

  // Lowercase + trim
  let m = raw.toLowerCase().trim();

  // Verwijder alle niet-alfanumerieke tekens
  m = m.replace(/[^a-z0-9]/g, "");

  // Alias mapping (uitbreidbaar)
  const aliases: Record<string, string> = {
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

  for (const key in aliases) {
    if (m.includes(key)) return aliases[key];
  }

  return m;
}
