export type ReceiptRecord = {
  id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
  user_id: string;
  ocrText: string | null;
  aiResult: string | null;
  imageHash: string | null;
  status: string;
  transaction_id: number | null;
  category: string | null;
  subCategory: string | null;
  merchant: string | null;
  merchant_category: string | null;
  purchase_date: string | null;
  total: number | null;
};
