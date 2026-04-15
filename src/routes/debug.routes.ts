import { Router } from "express";
import { db } from "../lib/db";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";
import { resolveCategory } from "../services/categories/resolveCategory";
import { upsertMerchantMemory } from "../services/merchantMemory/service/merchantMemory.service";

export const debugRouter = Router();

// ⭐ 1. merchant-memory
debugRouter.get("/merchant-memory", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT user_id, merchant, category_id, confidence
      FROM merchant_memory
      ORDER BY confidence ASC
    `,
    )
    .all() as {
    user_id: string;
    merchant: string;
    category_id: number;
    confidence: number;
  }[];

  res.json(rows);
});

// ⭐ 2. low-confidence
debugRouter.get("/merchant-memory/low-confidence", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT user_id, merchant, category_id, confidence
      FROM merchant_memory
      WHERE confidence < 0.3
      ORDER BY confidence ASC
    `,
    )
    .all() as {
    user_id: string;
    merchant: string;
    category_id: number;
    confidence: number;
  }[];

  res.json(rows);
});

// ⭐ 3. retrain-low-confidence
debugRouter.post("/retrain-low-confidence", async (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT user_id, merchant, category_id, confidence
      FROM merchant_memory
      WHERE confidence < 0.3
      ORDER BY confidence ASC
    `,
    )
    .all() as {
    user_id: string;
    merchant: string;
    category_id: number;
    confidence: number;
  }[];

  const results: any[] = [];

  for (const row of rows) {
    const normalized = normalizeMerchant(row.merchant);

    const category = resolveCategory(
      row.user_id,
      normalized.key,
      normalized.display,
      0,
    );

    upsertMerchantMemory(row.user_id, normalized.key, category.category_id);

    results.push({
      merchant: normalized,
      oldConfidence: row.confidence,
      newCategory: category,
      status: "retrained",
    });
  }

  return res.json({
    message: "Retraining completed using resolveCategory",
    retrained: results,
  });
});
