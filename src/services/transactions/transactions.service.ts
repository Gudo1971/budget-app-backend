import { db } from "../../lib/db";
import { normalizeDate } from "./transaction.utils";
import { matchingService } from "../matching/matching.service";
import { categorizeTransaction } from "../../categorization/categorizeTransaction";
import { upsertMerchantMemory } from "../../lib/merchantMemory";
import { normalizeCategory } from "../../categorization/normalizeCategory";

// ⭐ Uniforme mapping voor alle transacties
function mapTransaction(row: any) {
  return {
    id: row.id,
    date: row.transaction_date, // ⭐ FIX
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

export const transactionService = {
  // ⭐ GET ALL TRANSACTIONS (uniform return shape)
  getAll() {
    const rows = db
      .prepare(
        `
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
      `,
      )
      .all();

    return {
      success: true,
      data: rows.map(mapTransaction),
      error: null,
    };
  },

  // ⭐ CENTRALE CREATE-FLOW (PDF, CSV, manual, AI)

  async create({ receiptId, extracted = {}, form = {} }: any) {
    console.log(">>> CREATE CALLED WITH:", { receiptId, form, extracted });

    const userId = "demo-user";

    // ------------------------------------------------------------
    // ⭐ 1. Automatische bon-detectie
    // ------------------------------------------------------------
    const isReceipt = !!receiptId;

    // ------------------------------------------------------------
    // ⭐ 2. Bedrag bepalen (form > extracted)
    // ------------------------------------------------------------
    let amount = Number(form.amount ?? extracted.total ?? 0);

    if (isReceipt) {
      const text = extracted?.rawText?.toLowerCase() ?? "";

      const isRefund =
        text.includes("u ontvangt retour") ||
        text.includes("u ontvangt terug") ||
        text.includes("terugbetaling") ||
        text.includes("refund") ||
        text.includes("credit");

      amount = isRefund ? Math.abs(amount) : -Math.abs(amount);
    }

    // ------------------------------------------------------------
    // ⭐ 3. Datum bepalen
    // ------------------------------------------------------------
    const date = normalizeDate(
      form.date ?? extracted.date ?? new Date().toISOString(),
    );

    // ------------------------------------------------------------
    // ⭐ 4. Merchant & description bepalen
    // ------------------------------------------------------------
    const merchant =
      form.merchant ?? extracted.merchant ?? extracted.store ?? "Onbekend";

    const description =
      form.description ??
      extracted.description ??
      extracted.items?.[0]?.name ??
      extracted.merchant ??
      merchant ??
      "Onbekend";

    // ------------------------------------------------------------
    // ⭐ 5. Duplicate check
    // ------------------------------------------------------------
    const existing = db
      .prepare(
        `
      SELECT id FROM transactions
      WHERE DATE(transaction_date) = DATE(?)
        AND amount = ?
        AND LOWER(merchant) = LOWER(?)
        AND user_id = ?
    `,
      )
      .get(date, amount, merchant, userId) as { id: number } | null;

    if (existing?.id) {
      // ⭐ ALS ER EEN BON IS: KOPPEL HEM AAN BESTAANDE TRANSACTIE
      if (receiptId) {
        console.log(
          `🔗 Linking receipt ${receiptId} to existing transaction ${existing.id}`,
        );
        db.prepare(
          `UPDATE transactions SET receipt_id = ? WHERE id = ? AND user_id = ?`,
        ).run(receiptId, existing.id, userId);
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

    // ------------------------------------------------------------
    // ⭐ 6. Matching met banktransacties
    // ------------------------------------------------------------
    const match = matchingService.findMatch(amount, date, merchant, userId);

    if (match.match && match.transaction_id !== undefined) {
      matchingService.linkReceiptToTransaction(receiptId, match.transaction_id);

      return {
        success: true,
        data: {
          matched: true,
          transactionId: match.transaction_id,
          receiptId,
        },
        error: null,
      };
    }

    // ------------------------------------------------------------
    // ⭐ 7. Merchant-memory lookup (VOOR categorisatie)
    // ------------------------------------------------------------
    const memory = db
      .prepare(
        `
      SELECT category, subcategory 
      FROM merchant_memory
      WHERE user_id = ? AND LOWER(merchant) = LOWER(?)
    `,
      )
      .get(userId, merchant) as {
      category: string;
      subcategory: string;
    } | null;

    let category: string | null = null;
    let subcategory: string | null = null;

    if (memory) {
      category = memory.category;
      subcategory = memory.subcategory;
    } else {
      // ------------------------------------------------------------
      // ⭐ 8. Categorisatie-engine fallback
      // ------------------------------------------------------------
      const categorized = await categorizeTransaction({
        userId,
        merchantName: merchant,
        description,
        amount,
        date,
      });

      category = normalizeCategory(categorized.category);
      subcategory = categorized.subcategory;
    }

    // ------------------------------------------------------------
    // ⭐ 9. Insert transaction
    // ------------------------------------------------------------
    const stmt = db.prepare(`
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

    const result = stmt.run(
      receiptId ?? null,
      amount,
      date,
      date,
      merchant,
      description,
      category,
      subcategory,
      userId,
    );

    // ------------------------------------------------------------
    // ⭐ 10. Merchant-memory updaten
    // ------------------------------------------------------------
    upsertMerchantMemory(userId, merchant, category, subcategory);

    // ⭐ Forceer SQLite om ALLE writes te flushen
    db.pragma("wal_checkpoint(TRUNCATE)");

    // ------------------------------------------------------------
    // ⭐ 11. Uniform return shape
    // ------------------------------------------------------------
    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        receipt_id: receiptId ?? null,
        amount,
        date,
        merchant,
        description,
        category,
        subcategory,
        recurring: false,
        receipt: null,
        userId,
      },
      error: null,
    };
  },
};
