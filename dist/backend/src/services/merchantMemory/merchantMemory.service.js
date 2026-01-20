"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryForMerchant = getCategoryForMerchant;
exports.upsertMerchantMemory = upsertMerchantMemory;
const db_1 = require("../../lib/db");
function getCategoryForMerchant(user_id, merchant) {
    const row = db_1.db
        .prepare(`
      SELECT category_id
      FROM merchant_memory
      WHERE user_id = ?
        AND LOWER(merchant) = LOWER(?)
    `)
        .get(user_id, merchant);
    return row?.category_id ?? null;
}
function upsertMerchantMemory(user_id, merchant, category_id) {
    db_1.db.prepare(`
    INSERT INTO merchant_memory (user_id, merchant, category_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, merchant)
    DO UPDATE SET
      category_id = excluded.category_id,
      updated_at = datetime('now')
  `).run(user_id, merchant.toLowerCase(), category_id);
}
