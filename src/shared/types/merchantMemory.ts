export type MerchantMemoryRecord = {
  key: string; // normalized merchant key
  display: string; // human readable merchant
  category_id: number; // chosen category
  subcategory_id: number | null; // optional subcategory
  confidence: number; // similarity or learned confidence
  user_id: string; // owner of the memory
};
