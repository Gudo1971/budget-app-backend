export function heuristicsChooseCategory(
  merchant: string,
  amount: number,
  description?: string,
): { category: string | null; subcategory: string | null } {
  const lower = (merchant + " " + (description ?? "")).toLowerCase();

  // Streaming / abonnementen
  if (
    lower.includes("netflix") ||
    lower.includes("spotify") ||
    lower.includes("youtube")
  ) {
    return { category: "Abonnementen", subcategory: "Streaming" };
  }

  // Restaurants / eten
  if (
    lower.includes("restaurant") ||
    lower.includes("cafe") ||
    lower.includes("eten") ||
    lower.includes("food")
  ) {
    return { category: "Restaurant", subcategory: "Uit eten" };
  }

  // Supermarkten
  if (
    lower.includes("ah") ||
    lower.includes("albert") ||
    lower.includes("jumbo") ||
    lower.includes("lidl")
  ) {
    return { category: "Boodschappen", subcategory: null };
  }

  return { category: null, subcategory: null };
}
