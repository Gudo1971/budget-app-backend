"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerchantMemory = getMerchantMemory;
exports.upsertMerchantMemory = upsertMerchantMemory;
const db_1 = require("../lib/db");
function getMerchantMemory(user_id, merchant) {
    const normalized = merchant.toLowerCase().trim();
    const row = db_1.db
        .prepare(`
      SELECT category, subcategory
      FROM merchant_memory
      WHERE user_id = ?
        AND merchant = ?
    `)
        .get(user_id, normalized);
    return row ?? null;
}
function upsertMerchantMemory(user_id, merchant, category, subcategory) {
    const normalized = merchant.toLowerCase().trim();
    db_1.db.prepare(`
    INSERT INTO merchant_memory (user_id, merchant, category, subcategory, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category = excluded.category,
      subcategory = excluded.subcategory,
      updated_at = datetime('now')
  `).run(user_id, normalized, category, subcategory);
}
