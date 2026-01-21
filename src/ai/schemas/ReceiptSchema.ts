import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().default(1),
  price: z.number(),
  total: z.number().optional(),
  category: z.string().optional(),
});

export const ReceiptSchema = z.object({
  // Ruwe merchant zoals op de bon
  merchant_raw: z.string().optional(),

  // Genormaliseerde merchant (AI)
  merchant: z.string().optional(),

  // Datum op de bon (aankoopdatum)
  transaction_date: z.string().optional(),

  // Fallback datum (bijv. bankdatum)
  date: z.string().optional(),

  // Totaalbedrag van de bon
  total: z.number().optional(),

  currency: z.string().optional(),

  items: z.array(ReceiptItemSchema).default([]),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
