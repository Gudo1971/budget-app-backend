import { z } from "zod";

const parseAmount = (val: unknown) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  if (typeof val === "string") {
    const cleaned = val
      .replace(/[^\d\-,.]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

export const TransactionSchema = z.object({
  date: z.string().min(5).optional(),
  description: z.string().min(2).optional(),
  amount: z.preprocess(parseAmount, z.number().optional()),
  currency: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  confidence: z.number().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
