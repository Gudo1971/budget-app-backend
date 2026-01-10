import { z } from "zod";

export const TransactionSchema = z.object({
  merchant: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
