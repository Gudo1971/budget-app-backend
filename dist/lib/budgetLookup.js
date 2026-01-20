"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBudgetForCategory = findBudgetForCategory;
const db_1 = require("./db");
function findBudgetForCategory(categoryName) {
    const row = db_1.db
        .prepare(`
      SELECT b.id, b.name, b.limit, b.category_id
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      WHERE LOWER(c.name) = LOWER(?)
    `)
        .get(categoryName);
    return row || null;
}
