import { CATEGORY_MAP } from "./categoryMap";
import {
  getCategoryForMerchant,
  upsertMerchantMemory,
} from "../merchantMemory/service/merchantMemory.service";

export async function resolveCategory(
  userId: string,
  merchant: string,
  description: string,
  amount: number,
) {
  const merchantKey = merchant.toLowerCase();
  const desc = description.toLowerCase();

  // 1. Merchant memory (ASYNC!)
  const memory = await getCategoryForMerchant(userId, merchantKey);

  if (memory) {
    return {
      category_id: memory.category_id,
      confidence: memory.confidence,
      source: "merchant-memory",
    };
  }

  // 2. Keyword matching (merchant first)
  for (const [keyword, categoryId] of Object.entries(CATEGORY_MAP)) {
    if (merchantKey.includes(keyword)) {
      await upsertMerchantMemory(userId, merchantKey, categoryId);
      return {
        category_id: categoryId,
        confidence: 0.6,
        source: "keyword-merchant",
      };
    }
  }

  // 3. Keyword matching (description)
  for (const [keyword, categoryId] of Object.entries(CATEGORY_MAP)) {
    if (desc.includes(keyword)) {
      await upsertMerchantMemory(userId, merchantKey, categoryId);
      return {
        category_id: categoryId,
        confidence: 0.6,
        source: "keyword-description",
      };
    }
  }

  // 4. Fallback → Overig (13)
  return {
    category_id: 13,
    confidence: 0.1,
    source: "fallback",
  };
}
