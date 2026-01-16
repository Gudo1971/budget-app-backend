export type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id?: number | null;
  category?: string | null;
};
