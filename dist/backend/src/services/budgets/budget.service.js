"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBudget = createBudget;
const db_1 = require("../../lib/db");
const category_service_1 = require("../categories/category.service");
function createBudget(data) {
    const categoryId = (0, category_service_1.findOrCreateCategory)(data.category);
    const insert = db_1.db
        .prepare("INSERT INTO budgets (category_id, amount, period) VALUES (?, ?, ?)")
        .run(categoryId, data.amount, data.period);
    return insert.lastInsertRowid;
}
