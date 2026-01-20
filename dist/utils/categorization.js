"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineMerchantCategory = determineMerchantCategory;
async function determineMerchantCategory(parsedJson, db) {
    const merchant = parsedJson?.merchant;
    if (!merchant)
        return null;
    // 1) AI categorie
    if (parsedJson.merchant_category) {
        return parsedJson.merchant_category;
    }
    // 2) Merchant memory lookup
    try {
        const row = db
            .prepare("SELECT category FROM merchant_memory WHERE name = ?")
            .get(merchant);
        if (row?.category) {
            return row.category;
        }
    }
    catch (err) {
        console.error("Merchant memory lookup error:", err);
    }
    // 3) Heuristiek fallback
    const lower = merchant.toLowerCase();
    if (lower.includes("albert heijn") || lower.includes("jumbo")) {
        return "supermarket";
    }
    if (lower.includes("starbucks") || lower.includes("coffee")) {
        return "cafe";
    }
    if (lower.includes("mcdonald") || lower.includes("kfc")) {
        return "fastfood";
    }
    // 4) Geen categorie gevonden
    return null;
}
