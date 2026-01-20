import { getCategoryForMerchant } from "../services/merchantMemory/merchantMemory.service";
import { normalizeMerchant } from "../utils/merchant.utils";
import { aiChooseCategory } from "./aiChooseCategory";
import { heuristicsChooseCategory } from "./heuristicsChooseCategory";

export async function categorizeTransaction(
  userId: string,
  merchant: string,
  amount: number,
  description?: string,
): Promise<{
  category: string | null;
  subcategory: string | null;
  source: "memory" | "ai" | "heuristic" | "fallback";
}> {
  const normMerchant = normalizeMerchant(merchant);

  // 1. MEMORY
  const memoryCategoryId = getCategoryForMerchant(userId, normMerchant);

  if (memoryCategoryId) {
    return {
      category: memoryCategoryId.toString(),
      subcategory: null,
      source: "memory",
    };
  }

  // 2. AI (returns string)
  const aiCategory = await aiChooseCategory(
    normMerchant,
    description ?? "",
    [],
  );

  if (aiCategory) {
    return {
      category: aiCategory,
      subcategory: null,
      source: "ai",
    };
  }

  // 3. HEURISTICS (returns object)
  const heuristic = heuristicsChooseCategory(normMerchant, amount, description);

  if (heuristic?.category) {
    return {
      category: heuristic.category,
      subcategory: heuristic.subcategory ?? null,
      source: "heuristic",
    };
  }

  // 4. FALLBACK
  return {
    category: "Other",
    subcategory: null,
    source: "fallback",
  };
}
