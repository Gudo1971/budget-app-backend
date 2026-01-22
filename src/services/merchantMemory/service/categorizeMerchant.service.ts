import {
  getCategoryForMerchant,
  upsertMerchantMemory,
} from "./merchantMemory.service";
import { aiSuggestCategory } from "../../ai/categorize.service";

export async function categorizeMerchant(
  userId: string,
  canonicalKey: string,
  displayName: string,
): Promise<{
  category_id: number | null;
  source: "memory" | "ai" | "fallback";
  confidence: number;
}> {
  // 1. MEMORY FIRST
  const memory = getCategoryForMerchant(userId, canonicalKey);

  if (memory) {
    return {
      category_id: memory.category_id,
      confidence: memory.confidence ?? 1,
      source: "memory",
    };
  }

  // 2. AI SECOND
  const ai = await aiSuggestCategory(displayName);

  if (ai.category_id !== null) {
    if (ai.confidence >= 0.6) {
      upsertMerchantMemory(userId, canonicalKey, ai.category_id);
    }

    return {
      category_id: ai.category_id,
      confidence: ai.confidence,
      source: "ai",
    };
  }

  // 3. FALLBACK = null (GEEN 6 MEER)
  return {
    category_id: null,
    confidence: 0,
    source: "fallback",
  };
}
