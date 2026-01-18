export type ReceiptJson = {
  merchant: string | null;
  merchant_category: string | null;
  date: string | null;
  total: number | null;

  // ➜ voeg deze toe
  category?: string | null;
  subcategory?: string | null;

  // als je items wilt:
  items?: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
};
