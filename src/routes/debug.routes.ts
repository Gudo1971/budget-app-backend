import { Router } from "express";
import { db } from "../lib/db";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";
import { aiSuggestCategory } from "../services/ai/categorize.service";

import { upsertMerchantMemory } from "../services/merchantMemory/service/merchantMemory.service";

export const debugRouter = Router();

debugRouter.get("/merchant-memory", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT 
        user_id,
        merchant,
        category_id,
        confidence
      FROM merchant_memory
      ORDER BY confidence ASC
    `,
    )
    .all() as Array<{
    user_id: string;
    merchant: string;
    category_id: number;
    confidence: number;
  }>;

  // Map DB format to MerchantMemoryRecord type
  const mapped = rows.map((row) => ({
    key: row.merchant,
    display: row.merchant, // DB stores canonical key, not display name
    category_id: row.category_id,
    subcategory_id: null,
    confidence: row.confidence,
    user_id: row.user_id,
  }));

  res.json(mapped);
});

debugRouter.get("/merchant-memory/low-confidence", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT 
        user_id,
        merchant,
        category_id,
        confidence
      FROM merchant_memory
      WHERE confidence < 0.3
      ORDER BY confidence ASC
    `,
    )
    .all() as Array<{
    user_id: string;
    merchant: string;
    category_id: number;
    confidence: number;
  }>;

  // Map DB format to MerchantMemoryRecord type
  const mapped = rows.map((row) => ({
    key: row.merchant,
    display: row.merchant,
    category_id: row.category_id,
    subcategory_id: null,
    confidence: row.confidence,
    user_id: row.user_id,
  }));

  res.json(mapped);
});
debugRouter.post("/retrain", async (req, res) => {
  const { userId, merchant } = req.body;

  if (!userId || !merchant) {
    return res.status(400).json({ error: "userId and merchant are required" });
  }

  const normalized = normalizeMerchant(merchant);

  console.log(
    `[retrain] "${merchant}" → key="${normalized.key}" display="${normalized.display}"`,
  );

  // AI categorization (AI werkt op human-friendly naam)
  const aiCategory = await aiSuggestCategory(normalized.display);

  if (!aiCategory) {
    return res.status(500).json({
      error: "AI could not categorize merchant",
    });
  }

  const categoryId = aiCategory;

  // Update memory (memory werkt op canonical key)
  if (categoryId.category_id !== null) {
    upsertMerchantMemory(userId, normalized.key, categoryId.category_id);
  }

  return res.json({
    merchant: {
      raw: merchant,
      key: normalized.key,
      display: normalized.display,
    },
    aiCategory,
    categoryId,
    message: "Merchant retrained successfully",
  });
});

debugRouter.post("/retrain-low-confidence", async (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT 
        user_id,
        merchant,
        category_id,
        confidence
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

  if (rows.length === 0) {
    return res.json({
      message: "No low-confidence merchants found",
      retrained: [],
    });
  }

  const results: any[] = [];

  for (const row of rows) {
    const normalized = normalizeMerchant(row.merchant);

    console.log(
      `[retrain-all] retraining "${normalized}" (confidence=${row.confidence})`,
    );

    const aiCategory = await aiSuggestCategory(normalized.display);

    if (!aiCategory) {
      results.push({
        merchant: normalized,
        status: "AI failed",
      });
      continue;
    }

    const categoryId = aiCategory; // aiCategory is al een number

    if (categoryId.category_id !== null) {
      upsertMerchantMemory(row.user_id, normalized.key, categoryId.category_id);
    }

    results.push({
      merchant: normalized,
      aiCategory,
      categoryId,
      oldConfidence: row.confidence,
      status: "retrained",
    });
  }

  return res.json({
    message: "Retraining completed",
    retrained: results,
  });
});
