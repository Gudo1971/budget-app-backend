import { Router } from "express";
import { pool } from "../lib/db";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";
import { resolveCategory } from "../services/categories/resolveCategory";
import { upsertMerchantMemory } from "../services/merchantMemory/service/merchantMemory.service";

export const debugRouter = Router();

// ⭐ 1. merchant-memory
debugRouter.get("/merchant-memory", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT user_id, merchant, category_id, confidence
      FROM merchant_memory
      ORDER BY confidence ASC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching merchant memory:", error);
    res.status(500).json({ error: "Failed to fetch merchant memory" });
  }
});

// ⭐ 2. low-confidence
debugRouter.get("/merchant-memory/low-confidence", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT user_id, merchant, category_id, confidence
      FROM merchant_memory
      WHERE confidence < 0.3
      ORDER BY confidence ASC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching low confidence merchants:", error);
    res.status(500).json({ error: "Failed to fetch low confidence merchants" });
  }
});

// ⭐ 3. retrain-low-confidence
debugRouter.post("/retrain-low-confidence", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT user_id, merchant, category_id, confidence
      FROM merchant_memory
      WHERE confidence < 0.3
      ORDER BY confidence ASC
      `,
    );

    const results: any[] = [];

    for (const row of result.rows) {
      const normalized = normalizeMerchant(row.merchant);

      const category = await resolveCategory(
        row.user_id,
        normalized.key,
        normalized.display,
        0,
      );

      await upsertMerchantMemory(
        row.user_id,
        normalized.key,
        category.category_id,
      );

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
  } catch (error) {
    console.error("Error retraining low confidence merchants:", error);
    res.status(500).json({ error: "Failed to retrain merchants" });
  }
});
