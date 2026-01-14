import { db } from "../../lib/db";
import { normalizeDate } from "./transaction.utils";
import { matchingService } from "../matching/matching.service";
import { categorizeTransaction } from "../../categorization/categorizeTransaction";
import {
  getMerchantMemory,
  upsertMerchantMemory,
} from "../../lib/merchantMemory";

// ⭐ Uniforme mapping voor alle transacties
function mapTransaction(row: any) {
  return {
    id: row.id,
    receiptId: row.receipt_id ?? null,
    amount: row.amount,
    date: row.date,
    merchant: row.merchant,
    description: row.description,
    category: {
      name: row.category ?? null,
      subcategory: row.subcategory ?? null,
    },
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
          id,
          receipt_id,
          amount,
          date,
          transaction_date,
          merchant,
          description,
          category,
          subcategory,
          user_id
        FROM transactions
        ORDER BY transaction_date DESC
      `
      )
      .all();

    return {
      success: true,
      data: rows.map(mapTransaction),
      error: null,
    };
  },

  // ⭐ CENTRALE CREATE-FLOW (PDF, CSV, manual, AI)
  async create({ receiptId, extracted, form, source }: any) {
    // ⭐ CSV → normaliseer naar form
    if (source === "csv") {
      form = {
        amount: form.amount,
        date: form.date,
        merchant: form.merchant,
        description: form.description,
      };
      extracted = {};
    }

    const rawAmount = form.amount ?? extracted.total ?? 0;
    const amount = -Math.abs(rawAmount);

    const date = normalizeDate(
      form.date ?? extracted.date ?? new Date().toISOString()
    );

    const merchant: string = form.merchant ?? extracted.merchant ?? "Onbekend";
    const description: string =
      form.description || form.merchant || extracted.merchant || "Onbekend";

    const userId = "demo-user";

    // ⭐ Duplicate check
    const existing = db
      .prepare(
        `
        SELECT id FROM transactions
        WHERE DATE(transaction_date) = DATE(?)
          AND amount = ?
          AND LOWER(merchant) = LOWER(?)
          AND user_id = ?
      `
      )
      .get(date, amount, merchant, userId) as { id: number } | null;

    if (existing?.id) {
      return {
        success: true,
        data: {
          duplicate: true,
          transactionId: existing.id,
        },
        error: null,
      };
    }

    // ⭐ Matching met banktransacties
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

    // ⭐ Categorisatie-engine gebruiken
    const categorized = await categorizeTransaction({
      userId,
      merchantName: merchant,
      description,
      amount,
      date,
    });

    const { category, subcategory } = categorized;

    // ⭐ Insert transaction
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
      userId
    );

    // ⭐ Update merchant memory
    upsertMerchantMemory(userId, merchant, category, subcategory);

    // ⭐ Uniform return shape
    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        receiptId: receiptId ?? null,
        amount,
        date,
        merchant,
        description,
        category: {
          name: category,
          subcategory,
        },
        userId,
      },
      error: null,
    };
  },
};
