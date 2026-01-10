import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string(),
  quantity: z.number().default(1),
  price: z.number(),
  total: z.number().optional(), // sommige bonnen hebben line totals
  category: z.string().optional(),
});

export const ItemListSchema = z.array(ItemSchema);

export type Item = z.infer<typeof ItemSchema>;
export type ItemList = z.infer<typeof ItemListSchema>;
