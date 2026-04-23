export type ReceiptJson = {
  merchant: string | null;
  merchant_category: number | null;
  category: number | null;
  subcategory: number | null;
  date: string | null;
  total: number | null;

  items: {
    name: string;
    quantity: number;
    price: number | null;
    total: number | null;
  }[];
};
