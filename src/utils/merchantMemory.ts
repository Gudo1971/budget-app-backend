import type { Database } from "better-sqlite3";

export function updateMerchantMemory(args: {
  db: Database;
  userId: string;
  merchant: string;
  category: string;
  subcategory: string | null;
}) {
  const normalized = args.merchant.toLowerCase().trim();

  args.db
    .prepare(
      `
    INSERT INTO merchant_memory (user_id, merchant, category, subcategory, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category = excluded.category,
      subcategory = excluded.subcategory,
      updated_at = datetime('now')
  `,
    )
    .run(args.userId, normalized, args.category, args.subcategory);
}
