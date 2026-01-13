import { db } from "../../lib/db";
import { normalizeDate } from "./transaction.utils";
import { findOrCreateCategory } from "../categories/category.service";
import {
  getCategoryForMerchant,
  upsertMerchantMemory,
} from "../merchantMemory/merchantMemory.service";
import { matchingService } from "../matching/matching.service";

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
      id: row.category_id ?? null,
      name: row.category_name ?? null,
      type: row.category_type ?? null,
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
          t.id,
          t.receipt_id,
          t.amount,
          t.date,
          t.transaction_date,
          t.merchant,
          t.description,
          t.category_id,
          t.user_id,
          c.name AS category_name,
          c.type AS category_type
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        ORDER BY t.transaction_date DESC
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
  create({ receiptId, extracted, form, source }: any) {
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

    // ⭐ Category resolution (form → memory → AI → null)
    let categoryId: number | null = form.category_id ?? null;

    if (!categoryId) {
      const memory = getCategoryForMerchant(userId, merchant);
      if (memory) categoryId = memory;
    }

    if (!categoryId) {
      const raw = extracted.merchant_category?.trim() ?? null;
      const aiCategory = raw
        ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
        : null;

      if (aiCategory) {
        categoryId = findOrCreateCategory(aiCategory);
      }
    }

    // ⭐ Insert transaction
    const stmt = db.prepare(`
      INSERT INTO transactions (
        receipt_id,
        amount,
        date,
        transaction_date,
        merchant,
        description,
        category_id,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      receiptId ?? null,
      amount,
      date,
      date,
      merchant,
      description,
      categoryId ?? null,
      userId
    );

    // ⭐ Update merchant memory
    if (categoryId !== null) {
      upsertMerchantMemory(userId, merchant, categoryId);
    }

    // ⭐ Fetch category with proper typing
    const category =
      categoryId !== null
        ? (db
            .prepare("SELECT id, name, type FROM categories WHERE id = ?")
            .get(categoryId) as
            | { id: number; name: string; type: string }
            | undefined)
        : undefined;

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
        category: category
          ? {
              id: category.id,
              name: category.name,
              type: category.type,
            }
          : {
              id: null,
              name: null,
              type: null,
            },
        userId,
      },
      error: null,
    };
  },
};
