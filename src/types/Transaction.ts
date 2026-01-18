export type Transaction = {
  id: number;
  date: string; // ISO date string
  description?: string; // originele omschrijving van de bank (optioneel in queries)
  amount: number; // negatief = uitgave, positief = inkomen

  // Matching & receipts
  merchant: string; // genormaliseerde merchant naam
  receipt_id: number | null; // gekoppelde bon (of null)

  // Categorisatie
  category_id?: number | null;
  category?: string | null;
};
