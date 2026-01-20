import { normalizeMerchant } from "../utils/merchant.utils";
import { getCategoryForMerchant } from "../services/merchantMemory/merchantMemory.service";
import { aiChooseCategory } from "./aiChooseCategory";
import { heuristicsChooseCategory } from "./heuristicsChooseCategory";

export async function determineMerchantCategory(
  userId: string,
  merchant: string,
  description?: string,
): Promise<{
  category: string | null;
  subcategory: string | null;
  source: "memory" | "ai" | "heuristic" | "fallback";
}> {
  // 1. Normalize merchant
  const normMerchant = normalizeMerchant(merchant);

  // 2. Merchant memory
  const memoryCategoryId = getCategoryForMerchant(userId, normMerchant);

  if (memoryCategoryId) {
    return {
      category: memoryCategoryId.toString(),
      subcategory: null,
      source: "memory",
    };
  }

  // 3. AI fallback (returns string)
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

  // 4. Heuristics fallback
  const heuristic = heuristicsChooseCategory(normMerchant, 0, description);

  if (heuristic?.category) {
    return {
      category: heuristic.category,
      subcategory: heuristic.subcategory ?? null,
      source: "heuristic",
    };
  }

  // 5. Fallback
  return {
    category: "Other",
    subcategory: null,
    source: "fallback",
  };
}
