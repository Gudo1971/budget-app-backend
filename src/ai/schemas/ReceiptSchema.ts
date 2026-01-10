import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().default(1),
  price: z.number(),
  total: z.number().optional(),
  category: z.string().optional(),
});

export const ReceiptSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
  items: z.array(ReceiptItemSchema).default([]),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
