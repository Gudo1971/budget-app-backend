"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingTransaction = findMatchingTransaction;
const normalizeMerchant_1 = require("../helpers/normalizeMerchant");
const similarity_1 = require("../helpers/similarity");
const db_1 = require("../../lib/db");
async function findMatchingTransaction({ receiptId, amount, date, merchant, }) {
    const normalizedMerchant = (0, normalizeMerchant_1.normalizeMerchant)(merchant);
    // Typed DB query
    const transactions = db_1.db
        .prepare(`
    SELECT 
      id,
      date,
      description,
      amount,
      merchant,
      receipt_id,
      category_id,
      category
    FROM transactions
    WHERE user_id = ?
    `)
        .all("demo-user");
    let bestDuplicate = null;
    let bestAiMatch = null;
    let candidates = [];
    for (const tx of transactions) {
        const txMerchant = (0, normalizeMerchant_1.normalizeMerchant)(tx.merchant);
        const receiptAmount = Math.abs(amount);
        const txAmount = Math.abs(tx.amount);
        const amountDiff = Math.abs(receiptAmount - txAmount);
        const dayDiff = Math.abs(new Date(tx.date).getTime() - new Date(date).getTime()) /
            (1000 * 60 * 60 * 24);
        const merchantSim = (0, similarity_1.similarity)(normalizedMerchant, txMerchant);
        console.log(`🔍 Comparing with tx ${tx.id}:`, {
            merchant: tx.merchant,
            receiptAmount,
            txAmount,
            amountDiff,
            dayDiff,
            merchantSim,
        });
        if (amountDiff > 1)
            continue;
        if (merchantSim < 0.6)
            continue;
        let score = 0;
        if (amountDiff <= 0.1)
            score += 60;
        else if (amountDiff <= 0.5)
            score += 40;
        else if (amountDiff <= 1)
            score += 20;
        if (dayDiff === 0)
            score += 30;
        else if (dayDiff <= 1)
            score += 20;
        else if (dayDiff <= 3)
            score += 10;
        else if (dayDiff <= 7)
            score += 5;
        if (merchantSim >= 0.9)
            score += 10;
        else if (merchantSim >= 0.8)
            score += 7;
        else if (merchantSim >= 0.6)
            score += 4;
        console.log(`  -> Score: ${score}`);
        if (score >= 80) {
            bestDuplicate = tx;
            break;
        }
        if (score >= 60) {
            bestAiMatch = tx;
        }
        if (score >= 40) {
            candidates.push({ ...tx, score });
        }
    }
    if (bestDuplicate) {
        return {
            action: "duplicate",
            duplicate: bestDuplicate,
            aiMatch: null,
            candidates: [],
            summary: "100% match gevonden",
        };
    }
    if (bestAiMatch) {
        return {
            action: "aiMatch",
            aiMatch: bestAiMatch,
            duplicate: null,
            candidates: [],
            summary: "Waarschijnlijke match gevonden",
        };
    }
    if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        return {
            action: "candidates",
            candidates,
            duplicate: null,
            aiMatch: null,
            summary: "Mogelijke matches gevonden",
        };
    }
    return {
        action: "no-match",
        candidates: [],
        duplicate: null,
        aiMatch: null,
        summary: "Geen match gevonden",
    };
}
