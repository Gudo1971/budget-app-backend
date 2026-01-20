"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = void 0;
const db_1 = require("../../lib/db");
const transaction_utils_1 = require("./transaction.utils");
// ⭐ Uniforme mapping voor alle transacties
function mapTransaction(row) {
    return {
        id: row.id,
        date: row.transaction_date,
        description: row.description,
        amount: row.amount,
        merchant: row.merchant,
        receipt_id: row.receipt_id ?? null,
        category: row.category ?? null,
        subcategory: row.subcategory ?? null,
        recurring: row.recurring === 1,
        receipt: row.receipt_id
            ? {
                url: `/uploads/${row.receipt_filename}`,
                thumbnail: null,
                aiResult: row.receipt_ai_result
                    ? JSON.parse(row.receipt_ai_result)
                    : null,
            }
            : null,
        userId: row.user_id,
    };
}
exports.transactionService = {
    // ⭐ GET ALL TRANSACTIONS
    getAll() {
        console.log("📋 Fetching all transactions...");
        const rows = db_1.db
            .prepare(`
SELECT 
  t.id,
  t.receipt_id,
  t.amount,
  t.date,
  t.transaction_date,
  t.merchant,
  t.description,
  t.category,
  t.subcategory,
  t.user_id,
  t.recurring,

  r.filename AS receipt_filename,
  r.aiResult AS receipt_ai_result

FROM transactions t
LEFT JOIN receipts r ON r.id = t.receipt_id
ORDER BY t.transaction_date DESC
      `)
            .all();
        console.log(`✅ Found ${rows.length} transactions`);
        if (rows.length === 0) {
            console.log("⚠️ No transactions in database!");
        }
        return {
            success: true,
            data: rows.map(mapTransaction),
            error: null,
        };
    },
    // ⭐ CREATE FLOW — Backwards compatible (old & new format)
    async create(body) {
        console.log(">>> CREATE CALLED WITH:", body);
        // ⭐ SUPPORT BOTH FORMATS
        let amount, date, merchant, description, category, subcategory, receiptId, userId;
        // Nieuw format (van /link route)
        if (body.amount !== undefined && body.merchant !== undefined) {
            ({ amount, date, merchant, description, category, subcategory, receiptId, userId } =
                body);
        }
        // Oud format (van seed/csv import)
        else if (body.form && body.extracted) {
            const { form, extracted, receiptId: rid, source } = body;
            amount = form.amount || extracted.total;
            date = form.date || extracted.date;
            merchant = form.merchant || extracted.merchant;
            description = form.description;
            category = form.category || extracted.merchant_category;
            subcategory = form.subcategory || extracted.merchant_subcategory;
            receiptId = rid ?? null;
            userId = body.userId || "demo-user";
        }
        else {
            return {
                success: false,
                error: "Invalid input format",
                data: null,
            };
        }
        // Validatie
        if (amount == null || !merchant || !category) {
            return {
                success: false,
                error: "Missing required fields: amount, merchant, category",
                data: null,
            };
        }
        const normalizedDate = (0, transaction_utils_1.normalizeDate)(date ?? new Date().toISOString());
        const normalizedAmount = parseFloat(String(amount));
        // ⭐ CHECK VOOR DUPLICATE
        const existing = db_1.db
            .prepare(`
      SELECT id FROM transactions
      WHERE DATE(transaction_date) = DATE(?)
        AND amount = ?
        AND LOWER(merchant) = LOWER(?)
        AND user_id = ?
    `)
            .get(normalizedDate, normalizedAmount, merchant, userId || "demo-user");
        if (existing?.id) {
            // ⭐ ALS DUPLICATE: KOPPEL BON EN RETURN DUPLICATE STATUS
            if (receiptId) {
                console.log(`🔗 Linking receipt ${receiptId} to existing transaction ${existing.id}`);
                db_1.db.prepare(`UPDATE transactions SET receipt_id = ? WHERE id = ? AND user_id = ?`).run(receiptId, existing.id, userId || "demo-user");
            }
            return {
                success: true,
                data: {
                    duplicate: true,
                    transactionId: existing.id,
                    receiptLinked: !!receiptId,
                },
                error: null,
            };
        }
        // ⭐ GEEN DUPLICATE: MAAK NIEUWE TRANSACTIE
        const stmt = db_1.db.prepare(`
      INSERT INTO transactions (
        receipt_id,
        amount,
        date,
        transaction_date,
        merchant,
        description,
        category,
        subcategory,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(receiptId ?? null, normalizedAmount, normalizedDate, normalizedDate, merchant, description ?? merchant, category, subcategory ?? null, userId || "demo-user");
        db_1.db.pragma("wal_checkpoint(TRUNCATE)");
        console.log(`✅ Created transaction ${result.lastInsertRowid}`);
        return {
            success: true,
            data: {
                id: result.lastInsertRowid,
                receipt_id: receiptId ?? null,
                amount: normalizedAmount,
                date: normalizedDate,
                merchant,
                description: description ?? merchant,
                category,
                subcategory: subcategory ?? null,
                recurring: false,
                receipt: null,
                userId: userId || "demo-user",
                duplicate: false,
                matched: false,
            },
            error: null,
        };
    },
};
