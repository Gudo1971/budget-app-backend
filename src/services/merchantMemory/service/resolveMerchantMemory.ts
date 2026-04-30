import { getCategoryForMerchant } from "./merchantMemory.service";

export async function resolveMerchantMemory(userId: string, merchant: string) {
  // Gebruik merchant exact zoals hij binnenkomt
  const memory = await getCategoryForMerchant(userId, merchant);

  if (!memory) {
    return null;
  }

  return {
    merchant,
    category_id: memory.category_id,
    confidence: memory.confidence,
  };
}
