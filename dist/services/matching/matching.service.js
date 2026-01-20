"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchingService = void 0;
const db_1 = require("../../lib/db");
const string_utils_1 = require("./string.utils");
const date_utils_1 = require("./date.utils");
const amount_utils_1 = require("./amount.utils");
exports.matchingService = {
    findMatch(input, userId) {
        const { receiptId, amount, date, merchant } = input;
        // Normalize amount to absolute value for matching
        const normalizedAmount = Math.abs(amount);
        console.log("🔍 [MATCH v2] Starting match for:", {
            receiptId,
            amount,
            normalizedAmount,
            date,
            merchant,
        });
        // ------------------------------------------------------------
        // 1. DUPLICATE CHECK (exact match with normalized amounts)
        // ------------------------------------------------------------
        const duplicate = db_1.db
            .prepare(`
        SELECT id, amount, transaction_date AS date, merchant
        FROM transactions
        WHERE ABS(amount) = ?
          AND DATE(transaction_date) = DATE(?)
          AND LOWER(merchant) = LOWER(?)
          AND user_id = ?
          AND receipt_id IS NULL
      `)
            .get(normalizedAmount, date, merchant.toLowerCase(), userId);
        if (duplicate) {
            console.log("🔁 [MATCH v2] Exact duplicate found:", duplicate);
            return {
                action: "duplicate",
                duplicate,
                aiMatch: null,
                candidates: [],
                summary: `Exact duplicate found for merchant "${duplicate.merchant}" on ${duplicate.date}`,
            };
        }
        // ------------------------------------------------------------
        // 2. AI MATCH (fuzzy + tolerances)
        // ------------------------------------------------------------
        const dates = (0, date_utils_1.dateRange)(date, 2);
        const rows = db_1.db
            .prepare(`
        SELECT 
          id,
          amount,
          transaction_date AS date,
          merchant
        FROM transactions
        WHERE DATE(transaction_date) IN (${dates.map(() => "?").join(",")})
          AND user_id = ?
          AND receipt_id IS NULL
      `)
            .all(...dates, userId);
        let best = null;
        let bestScore = 0;
        const candidates = [];
        for (const row of rows) {
            // Use absolute values for amount comparison
            if (!(0, amount_utils_1.amountCloseEnough)(normalizedAmount, Math.abs(row.amount)))
                continue;
            const score = (0, string_utils_1.similarity)(merchant, row.merchant);
            if (score >= 0.4) {
                candidates.push({
                    id: row.id,
                    amount: row.amount,
                    date: row.date,
                    merchant: row.merchant,
                    score,
                });
            }
            if (score > bestScore) {
                bestScore = score;
                best = {
                    id: row.id,
                    amount: row.amount,
                    date: row.date,
                    merchant: row.merchant,
                };
            }
        }
        // High‑confidence AI match
        if (best && bestScore >= 0.75) {
            console.log("🤖 [MATCH v2] High-confidence AI match:", {
                best,
                score: bestScore,
            });
            return {
                action: "aiMatch",
                duplicate: null,
                aiMatch: best,
                candidates: [],
                summary: `AI match found with confidence ${bestScore.toFixed(2)}`,
            };
        }
        // ------------------------------------------------------------
        // 3. MULTIPLE CANDIDATES (low confidence)
        // ------------------------------------------------------------
        if (candidates.length > 0) {
            console.log("🧩 [MATCH v2] Multiple candidates found:", candidates);
            return {
                action: "candidates",
                duplicate: null,
                aiMatch: null,
                candidates,
                summary: `${candidates.length} possible matches found`,
            };
        }
        // ------------------------------------------------------------
        // 4. NO MATCH
        // ------------------------------------------------------------
        console.log("❌ [MATCH v2] No match found");
        return {
            action: "no-match",
            duplicate: null,
            aiMatch: null,
            candidates: [],
            summary: "No matching transactions found",
        };
    },
};
