"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeTransaction = categorizeTransaction;
const aiChooseCategory_1 = require("./aiChooseCategory");
const merchantMemory_1 = require("../lib/merchantMemory");
const guessSubcategory_1 = require("./guessSubcategory");
const db_1 = require("../lib/db");
async function categorizeTransaction({ userId, merchantName, description, amount, date, }) {
    console.log("CATEGORIZE INPUT:", { merchantName, description });
    // 1. Haal categorieën uit DB
    const rows = db_1.db
        .prepare("SELECT name FROM categories WHERE user_id = ?")
        .all(userId);
    const categories = rows.map((r) => r.name);
    // 2. MEMORY FIRST
    const memory = (0, merchantMemory_1.getMerchantMemory)(userId, merchantName);
    if (memory) {
        console.log("CATEGORIZED RESULT (MEMORY):", memory);
        return { ...memory, memoryApplied: true };
    }
    // 3. AI fallback
    const aiCategory = await (0, aiChooseCategory_1.aiChooseCategory)(merchantName, description, categories);
    let category = aiCategory;
    let subcategory = null;
    // 4. Heuristieken (string-based)
    const lower = (merchantName + " " + description).toLowerCase();
    if (lower.includes("netflix") ||
        lower.includes("spotify") ||
        lower.includes("youtube")) {
        category = "Abonnementen";
        subcategory = "Streaming";
    }
    if (lower.includes("restaurant") ||
        lower.includes("café") ||
        lower.includes("eten")) {
        category = "Restaurant";
        subcategory = "Uit eten";
    }
    // 5. Subcategorie guessing
    subcategory = (0, guessSubcategory_1.guessSubcategory)(category, merchantName, description);
    const result = {
        category,
        subcategory,
        memoryApplied: false,
    };
    // 6. Memory opslaan
    (0, merchantMemory_1.upsertMerchantMemory)(userId, merchantName, category, subcategory);
    console.log("CATEGORIZED RESULT:", result);
    return result;
}
