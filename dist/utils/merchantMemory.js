"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMerchantMemory = updateMerchantMemory;
function updateMerchantMemory(args) {
    const normalized = args.merchant.toLowerCase().trim();
    args.db
        .prepare(`
    INSERT INTO merchant_memory (user_id, merchant, category, subcategory, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category = excluded.category,
      subcategory = excluded.subcategory,
      updated_at = datetime('now')
  `)
        .run(args.userId, normalized, args.category, args.subcategory);
}
