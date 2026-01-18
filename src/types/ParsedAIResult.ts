export interface ParsedAIResult {
  merchant: string;
  merchant_category?: string;

  // AI stuurt dit:
  category?: string; // "Food and Drink"
  subcategory?: string; // "Café"

  // fallback die jij eerder gebruikte:
  subCategory?: string; // oude camelCase variant

  date?: string;
  purchase_date?: string;

  total: number;

  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}
