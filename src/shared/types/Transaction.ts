export type Transaction = {
  id: number;

  // Datums
  date: string;
  transaction_date?: string;

  // Beschrijving & bedrag
  description?: string;
  amount: number;

  // Merchant
  merchant?: string;
  merchant_raw?: string;

  // Koppelingen
  receipt_id: number | null;
  user_id?: string;

  // Categorieën
  category_id: number | null;
  subcategory_id?: number | null;

  recurring?: boolean;

  // Bon / AI
  receipt?: {
    id: number; // ⭐ BELANGRIJK: toegevoegd
    url: string;
    thumbnail?: string | null;

    aiResult?: {
      merchant?: string;
      amount?: number;
      date?: string;

      category?: string | null;
      subcategory?: string | null;

      recurring?: boolean;
      total?: number;

      items?: Array<{
        name: string;
        quantity?: number;
        price?: number;
        total?: number;
      }>;
    };

    thumbnailUrl?: string;
  } | null; // ⭐ BELANGRIJK: nullable gemaakt
};
