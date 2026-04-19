import { db } from "../../lib/db";
import { normalizeDate } from "./transaction.utils";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";
import { resolveCategory } from "../categories/resolveCategory";
import {
  upsertMerchantMemory,
  getCategoryForMerchant,
} from "../merchantMemory/service/merchantMemory.service";
import { transactionRepository } from "../../repositories/transactions.repository";

function mapTransaction(row: any) {
  const normalized = normalizeMerchant(row.merchant);

  return {
    id: row.id,
    date: row.transaction_date,
    description: row.description,
    amount: row.amount,
    merchant: normalized.display,
    receipt_id: row.receipt_id ?? null,
    category_id: row.category_id ?? null,
    subcategory_id: row.subcategory_id ?? null,
    recurring: row.recurring === 1,
    receipt: row.receipt_id
      ? {
          url: `http://localhost:3001/uploads/${row.receipt_filename}`,
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
  getAll() {
    const rows = db
      .prepare(
        `
SELECT 
  t.id,
  t.receipt_id,
  t.amount,
  t.transaction_date,
  t.merchant,
  t.description,
  t.category_id,
  t.subcategory_id,
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

  // ⭐ CREATE FLOW (NIEUW)
  async create(body: any) {
    console.log(">>> CREATE CALLED WITH:", body);

    let amount, date, merchant, description, receiptId, userId;

    // CSV / manual input
    if (body.amount !== undefined && body.merchant !== undefined) {
      ({ amount, date, merchant, description, receiptId, userId } = body);
    }
    // Extracted receipt
    else if (body.form && body.extracted) {
      const { form, extracted, receiptId: rid } = body;
      amount = form.amount || extracted.total;
      date = form.date || extracted.date;
      merchant = form.merchant || extracted.merchant;
      description = form.description || extracted.description;
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
    const normMerchant = normalizeMerchant(merchant);

    const rawAmount = parseFloat(String(amount));
    const absAmount = Math.abs(rawAmount);

    const desc = (description || "").toLowerCase();

    // ⭐ GKB-detectie
    const isGKB =
      normMerchant.key.includes("gkb") ||
      normMerchant.key.includes("bewind") ||
      normMerchant.key.includes("beheer") ||
      normMerchant.key.includes("reservering");

    // ⭐ Interne verschuivingen → negeren
    const isInternal =
      isGKB &&
      (desc.includes("weekgeld") ||
        desc.includes("leefgeld") ||
        desc.includes("reservering") ||
        desc.includes("vrij opneembaar") ||
        desc.includes("interne") ||
        desc.includes("overboeking"));

    if (isInternal) {
      return {
        success: true,
        data: {
          ignored: true,
          reason: "internal_transfer",
        },
        error: null,
      };
    }

    // ⭐ Inkomsten vs uitgaven
    const isIncome =
      desc.includes("uitkering") ||
      desc.includes("toeslag") ||
      desc.includes("loon") ||
      desc.includes("salaris") ||
      desc.includes("kindgebonden") ||
      desc.includes("kinderbijslag") ||
      desc.includes("budget") ||
      desc.includes("kgb");

    const normalizedAmount = isIncome ? absAmount : -absAmount;

    // ⭐ Duplicate check
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
        normMerchant.key,
        userId || "demo-user",
      ) as { id: number } | null;

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
    // ⭐ CATEGORISATIE ENGINE
    let categoryId = body.category_id ?? null;

    // 1) Als CSV of manual input een category_id geeft → gebruik die
    if (!categoryId) {
      // 2) Merchant memory check
      const memory = getCategoryForMerchant(
        userId || "demo-user",
        normMerchant.key,
      );

      if (memory) {
        categoryId = memory.category_id;
      } else {
        // 3) Fallback naar resolveCategory
        const categoryResult = resolveCategory(
          userId || "demo-user",
          normMerchant.key,
          description ?? normMerchant.display,
          normalizedAmount,
        );

        categoryId = categoryResult.category_id;
      }
    }

    // 4) Merchant memory leren
    upsertMerchantMemory(userId || "demo-user", normMerchant.key, categoryId);

    // ⭐ Insert
    const stmt = db.prepare(`
      INSERT INTO transactions (
        receipt_id,
        amount,
        transaction_date,
        merchant,
        description,
        category_id,
        subcategory_id,
        user_id,
        recurring
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      receiptId ?? null,
      normalizedAmount,
      normalizedDate,
      normMerchant.key,
      description ?? normMerchant.display,
      categoryId,
      null,
      userId || "demo-user",
      0,
    );

    // ⭐ Merchant memory bijwerken
    if (categoryId) {
      upsertMerchantMemory(userId || "demo-user", normMerchant.key, categoryId);
    }
    console.log(">>> MERCHANT MEMORY UPSERT:", {
      user: userId || "demo-user",
      merchant: normMerchant.key,
      categoryId,
    });
    db.pragma("wal_checkpoint(TRUNCATE)");

    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        receipt_id: receiptId ?? null,
        amount: normalizedAmount,
        date: normalizedDate,
        merchant: normMerchant.display,
        description: description ?? normMerchant.display,
        category_id: categoryId,
        subcategory_id: null,
        recurring: false,
        receipt: null,
        userId: userId || "demo-user",
        duplicate: false,
        matched: true,
      },
      error: null,
    };
  },

  async filter(params: any) {
    return transactionRepository.filter(params);
  },
};
