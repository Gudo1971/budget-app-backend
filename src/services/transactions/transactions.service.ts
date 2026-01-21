import { db } from "../../lib/db";
import { normalizeDate } from "./transaction.utils";
import { cleanMerchant } from "../../utils/cleanMerchant";
import { categorizeTransaction } from "../../categorization/categorizeTransaction";

// ⭐ Uniforme mapping voor alle transacties
function mapTransaction(row: any) {
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

export const transactionService = {
  // ⭐ GET ALL TRANSACTIONS
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

  // ⭐ CREATE FLOW
  async create(body: any) {
    console.log(">>> CREATE CALLED WITH:", body);

    let amount, date, merchant, description, receiptId, userId;

    // Nieuw format
    if (body.amount !== undefined && body.merchant !== undefined) {
      ({ amount, date, merchant, description, receiptId, userId } = body);
    }
    // Oud format (seed/csv)
    else if (body.form && body.extracted) {
      const { form, extracted, receiptId: rid } = body;
      amount = form.amount || extracted.total;
      date = form.date || extracted.date;
      merchant = form.merchant || extracted.merchant;
      description = form.description;
      receiptId = rid ?? null;
      userId = body.userId || "demo-user";
    } else {
      return {
        success: false,
        error: "Invalid input format",
        data: null,
      };
    }

    if (amount == null || !merchant) {
      return {
        success: false,
        error: "Missing required fields: amount, merchant",
        data: null,
      };
    }

    const normalizedDate = normalizeDate(date ?? new Date().toISOString());
    const normalizedAmount = parseFloat(String(amount));
    const normMerchant = cleanMerchant(merchant);

    // ⭐ DUPLICATE CHECK (normalized merchant)
    const existing = db
      .prepare(
        `
      SELECT id FROM transactions
      WHERE DATE(transaction_date) = DATE(?)
        AND amount = ?
        AND merchant = ?
        AND user_id = ?
    `,
      )
      .get(
        normalizedDate,
        normalizedAmount,
        normMerchant,
        userId || "demo-user",
      ) as {
      id: number;
    } | null;

    if (existing?.id) {
      if (receiptId) {
        db.prepare(
          `UPDATE transactions SET receipt_id = ? WHERE id = ? AND user_id = ?`,
        ).run(receiptId, existing.id, userId || "demo-user");
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

    // ⭐ CATEGORISATIE (nieuwe engine)
    const categorization = await categorizeTransaction(
      userId || "demo-user",
      normMerchant,
      normalizedAmount,
      description ?? "",
    );

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
      normalizedAmount,
      normalizedDate,
      normalizedDate,
      normMerchant,
      description ?? normMerchant,
      categorization.category,
      categorization.subcategory,
      userId || "demo-user",
    );

    db.pragma("wal_checkpoint(TRUNCATE)");

    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        receipt_id: receiptId ?? null,
        amount: normalizedAmount,
        date: normalizedDate,
        merchant: normMerchant,
        description: description ?? normMerchant,
        category: categorization.category,
        subcategory: categorization.subcategory,
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
