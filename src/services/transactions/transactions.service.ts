import { pool } from "../../lib/db";
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
    recurring: row.recurring === true || row.recurring === 1,
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
  // ------------------------------------------------------------
  // GET ALL
  // ------------------------------------------------------------
  async getAll() {
    const result = await pool.query(
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
    );

    return {
      success: true,
      data: result.rows.map(mapTransaction),
      error: null,
    };
  },

  // ------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // INTERNAL TRANSFERS (GKB)
    // ------------------------------------------------------------
    const isGKB =
      normMerchant.key.includes("gkb") ||
      normMerchant.key.includes("bewind") ||
      normMerchant.key.includes("beheer") ||
      normMerchant.key.includes("reservering");

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

    // ------------------------------------------------------------
    // INCOME vs EXPENSE
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // DUPLICATE CHECK
    // ------------------------------------------------------------
    const duplicateResult = await pool.query(
      `
      SELECT id 
      FROM transactions
      WHERE DATE(transaction_date) = DATE($1)
        AND amount = $2
        AND merchant = $3
        AND user_id = $4
      `,
      [
        normalizedDate,
        normalizedAmount,
        normMerchant.key,
        userId || "demo-user",
      ],
    );

    const existing = duplicateResult.rows[0];

    if (existing?.id) {
      if (receiptId) {
        await pool.query(
          `
          UPDATE transactions
          SET receipt_id = $1
          WHERE id = $2 AND user_id = $3
          `,
          [receiptId, existing.id, userId || "demo-user"],
        );
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
    // CATEGORY RESOLUTION
    // ------------------------------------------------------------
    let categoryId = body.category_id ?? null;

    if (!categoryId) {
      const memory = await getCategoryForMerchant(
        userId || "demo-user",
        normMerchant.key,
      );

      if (memory) {
        categoryId = memory.category_id;
      } else {
        const categoryResult = await resolveCategory(
          userId || "demo-user",
          normMerchant.key,
          description ?? normMerchant.display,
          normalizedAmount,
        );

        categoryId = categoryResult.category_id;
      }
    }

    // ------------------------------------------------------------
    // MERCHANT MEMORY UPSERT
    // ------------------------------------------------------------
    await upsertMerchantMemory(
      userId || "demo-user",
      normMerchant.key,
      categoryId,
    );

    // ------------------------------------------------------------
    // INSERT TRANSACTION
    // ------------------------------------------------------------
    const insertResult = await pool.query(
      `
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
      VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, FALSE)
      RETURNING id
      `,
      [
        receiptId ?? null,
        normalizedAmount,
        normalizedDate,
        normMerchant.key,
        description ?? normMerchant.display,
        categoryId,
        userId || "demo-user",
      ],
    );

    const newId = insertResult.rows[0].id;

    return {
      success: true,
      data: {
        id: newId,
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

  // ------------------------------------------------------------
  // FILTER (repository is al Postgres)
  // ------------------------------------------------------------
  async filter(params: any) {
    return transactionRepository.filter(params);
  },
};
