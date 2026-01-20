"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFixedCost = createFixedCost;
const db_1 = require("../../lib/db");
const category_service_1 = require("../categories/category.service");
function createFixedCost(data) {
    const categoryId = (0, category_service_1.findOrCreateCategory)(data.name);
    const insert = db_1.db
        .prepare("INSERT INTO fixed_costs (name, amount, interval, category_id) VALUES (?, ?, ?, ?)")
        .run(data.name, data.amount, data.interval, categoryId);
    return insert.lastInsertRowid;
}
